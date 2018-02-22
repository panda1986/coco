#!python
# -*- coding: utf-8 -*-

import sys
import MySQLdb, traceback, time, subprocess, shlex, eventlet, datetime
import os, pyautogui, htc_constant
from PIL import Image

error_success = 0
system_sql_execute_failed = 100
system_process_init_error = 101
system_process_return_error = 102
system_process_timeout = 103
system_process_execute = 104

system_convert_crop_png_error = 110

def __create_process(command, stdout_fd, stderr_fd, log_file=None):
    # log the original command
    msg = "process start command: %s"%(command);

    #print msg
    if log_file is not None:
        log_file.write("%s\n"%(msg));

    # to avoid shell injection, directly use the command, no need to filter.
    args = shlex.split(str(command));
    process = subprocess.Popen(args, stdout=stdout_fd, stderr=stderr_fd);

    return process;

def run_process_instant_read_output(command, timeout):
    (code, stdout_str, stderr_str) = (error_success, None, None);
    process = None;

    try:
        process = __create_process(command, subprocess.PIPE, subprocess.PIPE);

        if process is None:
            code = system_process_init_error;
            #print("utility+process start process failed. code=%d, cmd=%s"%(code, command));
            return (code, stdout_str, stderr_str);

        starttime = time.time();
        while True:
            # the poll will set the process.returncode
            process.poll();

            # None incidates the process hasn't terminate yet.
            if process.returncode is not None:
                # process terminated, check the returncode.
                if process.returncode != 0:
                    code = system_process_return_error;
                    #print("utility+process return error. code=%d, cmd=%s"%(code, command));
                    return (code, stdout_str, stderr_str);
                else:
                    #print("utility+process terminate normally, code=%d, cmd=%s"%(code, command));
                    (stdout_str, stderr_str) = process.communicate();
                    return (code, stdout_str, stderr_str);

            # check timeout
            if time.time() - starttime >= int(timeout):
                stdout_str, stderr_str = process.communicate()
                if process.returncode == 0:
                    return code, stdout_str, stderr_str
                # kill the process when user cancel.
                process.kill();

                code = system_process_timeout;
                #print("utility+process user terminate the process. code=%d, cmd=%s"%(code, command));
                return (code, stdout_str, stderr_str);

            eventlet.green.time.sleep(0.2);
    except Exception, ex:
        code = system_process_execute;
        #print("utility+process execute failed. code=%d, ex=%s"%(code, ex));
        return (code, stdout_str, stderr_str);
    finally:
        # to avoid process zombile.
        # warning: only the process is terminated, use the wait.
        if process is not None:
            process.wait();
    pass;

class MysqlClient:
    def __init__(self, host, port, user, password, db, charset):
        self.__tag = "mysql";
        self.host = host;
        self.port = port;
        self.user = user;
        self.passwd = password;
        self.db = db;
        self.charset = charset;

    def execute(self, sql_format_str, sql_value_tuple=None, get_inserted_id = False):
        code = error_success;
        (conn, cur) = (None, None);

        try:
            # @see: http://eventlet.net/doc/modules/db_pool.html
            # @remark: we directly use the MySQLdb, for the api and cycle thread will invoke.
            conn = MySQLdb.connect(host=self.host, port=self.port, user=self.user, passwd=self.passwd, db=self.db, charset=self.charset);

            # test the db connection.
            if sql_format_str is None:
                return (code, 0, None);

            cur = conn.cursor(MySQLdb.cursors.DictCursor);

            if sql_value_tuple:
                rows_affected = cur.execute(sql_format_str, sql_value_tuple);
            else:
                rows_affected = cur.execute(sql_format_str);

            # for insert: get the inserted id.
            if get_inserted_id:
                result = conn.insert_id();
            else:
                result = cur.fetchall();

            conn.commit();

            return (code, rows_affected, result);
        except Exception, ex:
            code = system_sql_execute_failed;
            print(self.__tag,
                  "execute sql failed, code=%d, sql=%s, value=%s, ex=%s, stack=%s"%(
                      code, sql_format_str, sql_value_tuple, ex, traceback.format_exc()
            ))
            return (code, 0, None);
        finally:
            if cur is not None:
                cur.close();
            if conn is not None:
                conn.close();

def now():
    return str(datetime.datetime.now());

def write_log(msg):
    f = open("./coco.log", "a+");

    time = now();
    msg = "[%s] %s" % (time, msg);

    f.write("%s\n" % (msg));

    f.close();

def write_error_log(msg):
    f = open("./coco_error.log", "a+");

    time = now();
    msg = "[%s] %s" % (time, msg);

    f.write("%s\n" % (msg));

    f.close();

'''
If you want the crop rectangle to start at top corner X: 50 Y: 100 and the crop rectangle to be of size W: 640 H:480, then use the command:
convert foo.png -crop 640x480+50+100 out.png
'''
def convert(pos, source):
    #if os.path.exists(pos["pngName"]):
        #os.remove(pos["pngName"])
    cmd = 'convert %s -crop %dx%d+%d+%d %s' % (source, pos["w"], pos["h"], pos["x"], pos["y"], pos["pngName"]);

    (code, stdout_str, stderr_str) = run_process_instant_read_output(cmd, timeout=60);

    if code != 0:
        code = system_convert_crop_png_error;
        write_error_log("convert crop error, cmd=%s, code=%d" % (cmd, code))
        return (code, None);
    return error_success

def image_to_string(img, cleanup=True, plus=''):
    # cleanup为True则识别完成后删除生成的文本文件
    # plus参数为给tesseract的附加高级参数
    cmd = 'tesseract %s %s %s' % (img, img, plus)
    (code, stdout_str, stderr_str) = run_process_instant_read_output(cmd, timeout=60); # 生成同名txt文件
    text = ''
    with open(img + '.txt', 'r') as f:
        text = f.read().strip()
    if cleanup:
        os.remove(img + '.txt')
    #print "img %s result %s" % (img, text)
    text = text.replace(' ', '')
    return text

def deal_img(src):
    name, ext = os.path.splitext(src)
    #  load a color image
    im = Image.open(src)

    #  convert to grey level image
    Lim = im.convert('L')
    mid = name + '_''fun_Level.tif'
    Lim.save(mid)
    #  setup a converting table with constant threshold
    threshold = 80
    table = []
    for i in range(256):
        if i < threshold:
            table.append(0)
        else:
            table.append(1)

    # convert to binary image by the table
    bim = Lim.point(table, '1')

    final = name + '_fun_binary.tif'
    bim.save(final)
    return mid, final

def clear(source, count, amount, middle):
    if os.path.exists(source):
        os.remove(source)
    if len(middle) > 0 and os.path.exists(middle):
        os.remove(middle)
    if len(count) > 0 and os.path.exists(count):
        os.remove(count)
    if len(amount) > 0 and os.path.exists(amount):
        os.remove(amount)
    pass

def clear_single_png(final):
    if len(final) > 0 and os.path.exists(final):
        os.remove(final)
    pass

def clear_account(account):
    if len(account) > 0 and os.path.exists(account):
        os.remove(account)
    pass

def deal_master_slave(source, tt):
    (master, slave) = (0, 0)
    code = convert(htc_constant.AmountBetPos, source)
    if code != error_success:
        write_error_log("convert crop amount bet failed, loop continue")
        clear(source, htc_constant.CountDownPos["pngName"], htc_constant.AmountBetPos["pngName"], "")
        return (master, slave)

    middle, final = deal_img(htc_constant.AmountBetPos["pngName"])
    write_log("deal amountbet success, generate final png")
    res = image_to_string(final, plus="-l eng")
    if len(res) == 0:
        write_error_log("ocr amount bet text failed, loop continue")
        clear(source, htc_constant.CountDownPos["pngName"], htc_constant.AmountBetPos["pngName"], middle)
        return (master, slave)

    clear(source, htc_constant.CountDownPos["pngName"], htc_constant.AmountBetPos["pngName"], middle)
    values = res.split('\n')
    decode_bet = True
    data = []
    for v in values:
        for k in range(len(v)):
            if not v[k].isdigit() and v[k] != '.':
                v = v[:k]
                break
        if len(v) > 0:
            try:
                data.append(float(v))
            except Exception, ex:
                write_error_log(
                    "parse amount bet to float failed, exception, ex=%s, stack=%s, loop continue" % (
                        ex, traceback.format_exc()))
                decode_bet = False
            finally:
                pass

    if not decode_bet:
        return (master, slave)

    if len(data) != 2:
        write_error_log(
            "ocr amount bet detail number failed, ori=%s, res=%s loop continue" % (values, data))
        return (master, slave)

    clear_single_png(final)
    master = data[0]
    slave = data[1]
    write_log("deal amount master=%f, slave=%f" % (master, slave))
    return (master, slave)

def deal_count_down(source):
    count_down = -1
    code = convert(htc_constant.CountDownPos, source)
    if code != error_success:
        write_error_log("convert crop count down failed, loop continue")
        clear(source, "", "", "")
        return count_down

    res = image_to_string(htc_constant.CountDownPos["pngName"], plus="-psm 7")
    if len(res) == 0:
        write_error_log("ocr count down text failed, loop continue")
        clear(source, htc_constant.CountDownPos["pngName"], "", "")
        return count_down

    try:
        count_down = int(res)
    except Exception, ex:
        write_error_log("parse count down text to int failed, exception, ex=%s, stack=%s, loop continue" % (
        ex, traceback.format_exc()))
        clear(source, htc_constant.CountDownPos["pngName"], "", "")
        return -1
    finally:
        return count_down

def deal_account_value(source, tt):
    account_value = -1
    segs = ["imgs", "account.png"]
    htc_constant.AccountValuePos["pngName"] = "%s/%s_%s" % (segs[0], tt, segs[1])
    code = convert(htc_constant.AccountValuePos, source)
    if code != error_success:
        write_log("convert crop account failed, loop continue")
        clear(source, "", "", "")
        return account_value

    middle, final = deal_img(htc_constant.AccountValuePos["pngName"])
    clear_single_png(source)
    clear_single_png(htc_constant.AccountValuePos["pngName"])
    clear_single_png(middle)
    if htc_constant.host_type == htc_constant.imac_zhuxinzhuang_type:
        res = image_to_string(final, plus="-l num")
    else:
        res = image_to_string(final, plus="-psm 8")
    if len(res) == 0:
        write_log("ocr account value text failed, loop continue")
        return account_value

    try:
        account_value = float(res)
    except Exception, ex:
        write_log("parse account value text to int failed, exception, ex=%s, stack=%s, loop continue" % (
        ex, traceback.format_exc()))
        account_value = -1
    finally:
        if account_value > 0:
            clear_single_png(final)
        return account_value

# check if valid,
# if count down parse success
## check count down
### if count down satisfy
#### parse master, slave
#### return count down, master, slave
def do_cycle():
    valid = False
    (count_down, master, slave) = (0, 0, 0)

    tt = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
    source = "./imgs/whole_%s.png" % (tt)
    im = pyautogui.screenshot(source)
    count_down = deal_count_down(source)
    # if need parse account value
    if count_down > 0 and htc_constant.last_account_value == -1:
        write_log("first to parse account_value...")
        htc_constant.last_account_value = deal_account_value(source, tt)
        write_log("first account value=%d" % (htc_constant.last_account_value))

    # check if need buy
    if count_down > htc_constant.min_count_down or count_down < 0:
        clear(source, htc_constant.CountDownPos["pngName"], "", "")
        write_log(
            "count down=%d not staisfy, ignore" % (count_down))
        return (valid, count_down, master, slave)

    valid = True
    (master, slave) = deal_master_slave(source, tt)
    write_log("count down=%d satisfy, master=%f, slave=%f" % (count_down, master, slave))
    return (valid, count_down, master, slave)


def get_final_master_slave():
    tt = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
    source = "./imgs/whole_%s.png" % (tt)
    im = pyautogui.screenshot(source)
    (master, slave) = deal_master_slave(source, tt)
    clear(source, "", "", "")
    return (master, slave)


coco_mysql = MysqlClient("127.0.0.1", 3306, "root", "test", "htc_coco", "utf8")
def insert_coco_item(req, tt):
    state = 0
    diff = req["account_value"] - req["last_account_value"]
    if diff > 0:
        state = 1
    elif diff < 0:
        state = -1

    write_log("insert into mysql, buy_option=%s, set_diff=%d, actual_diff=%d, state=%d, last_account_value=%d, account_value=%d" % (
        req["buy_option"], req["set_master"] - req["set_slave"], req["actual_master"] - req["actual_slave"], state, req["last_account_value"], req["account_value"])
              )

    (code, rows_affected, id) = coco_mysql.execute(
        "insert into analysis" \
        "(create_time, buy_option, set_diff, set_master, set_slave, actual_diff, actual_master, actual_slave, state, last_account_value, account_value) " \
        "values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (
            int(tt), req["buy_option"], req["set_master"] - req["set_slave"], req["set_master"], req["set_slave"], req["actual_master"] - req["actual_slave"],
            req["actual_master"], req["actual_slave"], state, req["last_account_value"], req["account_value"]
        ), get_inserted_id=True
    );
    if code != 0:
        print("insert coco item to db failed. code=%d" % (code));
        return (code, None);

    assert (id > 0);
    return (error_success, id);

def items_all():
    (code, rows_affected, result) = coco_mysql.execute("select * from analysis order by id asc");
    if code != 0:
        print ("get items failed. code=%d" % (code));
        return (code, None);

    items = [];
    for row in result:
        items.append({
            "id": row["id"],
            "create_time": row["create_time"],
            "buy_option": row["buy_option"],
            "set_diff": row["set_diff"],
            "set_master": row["set_master"],
            "set_slave": row["set_slave"],
            "actual_diff": row["actual_diff"],
            "actual_master": row["actual_master"],
            "actual_slave": row["actual_slave"],
            "state": row["state"],
            "last_account_value": row["last_account_value"],
            "account_value": row["account_value"],
        });
    return (0, items)

def update_item(req):
    (code, rows_affected, result) = coco_mysql.execute(
        "update analysis set set_diff=%s, actual_diff=%s, state=%s, last_account_value=%s  where id=%s",
        (req["set_diff"], req["actual_diff"], req["state"], req["last_account_value"], req["id"])
    );
    if code != 0:
        print ("update item failed, code=%d"%(code))
        return code;

    return 0;

