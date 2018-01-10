#!python
# -*- coding: utf-8 -*-

import pyautogui
import time, subprocess, shlex, eventlet, os, datetime, traceback
from PIL import Image

error_success = 0
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
    mid = name + '_''fun_Level.png'
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

    final = name + '_fun_binary.png'
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

def clear_final(final):
    if len(final) > 0 and os.path.exists(final):
        os.remove(final)
    pass

# should sleep some seconds to prepare page
CurrentMacSize = 15
start_sleep = 10
pyautogui.PAUSE = 0.3
pyautogui.FAILSAFE = False
min_count_down = 5
max_data_error_diff = 1000000
check_data_change_interval = 300000
max_diff_per = 35
positive_max_per = 30
positive_min_per = 5
write_log("sleep %d seconds to capture" % (start_sleep))
time.sleep(start_sleep)

# CountDownPos = {
#     "x": 130 * 2,
#     "y":120 * 2,
#     "w": 83 * 2,
#     "h":33 * 2,
#     "pngName": "count_down.png",
#     "result": 0,
# }

CountDownPos = {
    "x": 130 * 2,
    "y":105 * 2,
    "w": 119 * 2,
    "h":47 * 2,
    "pngName": "count_down.png",
    "result": 0,
}

# AmountBetPos = {
#     "x": 1171 * 2,
#     "y":97 * 2,
#     "w": 74 * 2,
#     "h":35 * 2,
#     "pngName": "amount_bet.png",
#     "master": 0,
#     "slave": 0
# }

AmountBetPos = {
    "x": 1564 * 2,
    "y":78 * 2,
    "w": 120 * 2,
    "h":50 * 2,
    "pngName": "amount_bet.png",
    "master": 0,
    "slave": 0
}

# MasterClickPos = {
#     "x": 752,
#     "y": 563
# }
#
# SlaveClickPos = {
#     "x": 739,
#     "y": 599
# }
#
# ConfirmClickPos = {
#     "x": 659,
#     "y": 660
# }

MasterClickPos = {
    "x": 865,
    "y": 714
}

SlaveClickPos = {
    "x": 855,
    "y": 778
}

ConfirmClickPos = {
    "x": 890,
    "y": 858
}

# EnterClickPos = {
#     "x": 600,
#     "y": 452
# }
EnterClickPos = {
    "x": 800,
    "y": 570
}

last_master = 0.0
last_slave = 0.0
while True:
    tt = time.strftime('%Y%m%d%H%M%S',time.localtime(time.time()))
    source = "./imgs/whole_%s.png" % (tt)
    im = pyautogui.screenshot(source)
    #write_log("screen shot %s success" % (source))

    CountDownPos["pngName"] = "./imgs/" + tt + "count_down.png"
    code = convert(CountDownPos, source)
    if code != error_success:
        write_error_log("convert crop count down failed, loop continue")
        clear(source, "", "", "")
        continue

    res = image_to_string(CountDownPos["pngName"], plus="-psm 7")
    if len(res) == 0:
        write_error_log("ocr count down text failed, loop continue")
        clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], "")
        res = list(pyautogui.locateAllOnScreen('enter.png'))
        if len(res) > 0:
            write_log("has enter, click to enter game, and mouse move to origin")
            last_master = last_slave = 0
            pyautogui.click(EnterClickPos["x"], EnterClickPos["y"])
            pyautogui.moveTo(10, 500)
        continue

    try:
        CountDownPos["result"] = int(res)
    except Exception, ex:
        write_error_log("parse count down text to int failed, exception, ex=%s, stack=%s, loop continue" % (ex, traceback.format_exc()))
        clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], "")
        res = list(pyautogui.locateAllOnScreen('enter.png'))
        if len(res) > 0:
            write_log("has enter, click to enter game, and mouse move to origin")
            last_master = last_slave = 0
            pyautogui.click(EnterClickPos["x"], EnterClickPos["y"])
            pyautogui.moveTo(10, 500)
        continue
    finally:
        pass

    #check if need buy
    if CountDownPos["result"] > min_count_down or CountDownPos["result"] < 0:
        clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], "")
        write_log("count down=%d not staisfy, ignore, last=%f %f" % (CountDownPos["result"], last_master, last_slave))
        continue

    AmountBetPos["pngName"] = "./imgs/" + tt + "amount_bet.png"
    code = convert(AmountBetPos, source)
    if code != error_success:
        write_error_log("convert crop amount bet failed, loop continue")
        clear(source, CountDownPos["pngName"], "", "")
        continue

    middle, final = deal_img(AmountBetPos["pngName"])
    write_log("deal amountbet success, generate final png")
    res = image_to_string(final, plus="-l eng")
    if len(res) == 0:
        write_error_log("ocr amount bet text failed, loop continue")
        clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], middle)
        continue

    clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], middle)
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
                write_error_log("parse amount bet to float failed, exception, ex=%s, stack=%s, loop continue" % (ex, traceback.format_exc()))
                decode_bet = False
            finally:
                pass

    if not decode_bet:
        continue

    if len(data) != 2:
        write_error_log("ocr amount bet detail number failed, ori=%s, res=%s loop continue" % (values, data))
        continue

    clear_final(final)
    AmountBetPos["master"] = data[0]
    AmountBetPos["slave"] = data[1]
    write_log("ocr amount bet detail success, amount bet=%f %f" % (data[0], data[1]))

    # d1 = AmountBetPos["master"] - last_master
    # d2 = AmountBetPos["slave"] - last_slave
    # if d1 < 0 or d2 < 0 or d1 > check_data_change_interval or d2 > check_data_change_interval:
    #     write_log("amount bet=%f %f invalid, less than last=%f %f" % (data[0], data[1], last_master, last_slave))
    #     continue

    # if master-slave > 10W set slave; if master - slave < -10W, set master; if diff > 100W， data error
    diff = AmountBetPos["master"] - AmountBetPos["slave"]
    # if diff > max_data_error_diff or diff < -max_data_error_diff:
    #     write_log("amount bet=%f %f invalid, diff to large, ignore this" % (data[0], data[1]))
    #     continue
    last_master = AmountBetPos["master"]
    last_slave = AmountBetPos["slave"]

    buy_option = ''
    per = 0

    #if diff >0, diffPer = diff * 100 / master; diffPer > 40; set slave
    if diff > 0:
        per = diff * 100 / AmountBetPos["master"];
        if per > max_diff_per:
            buy_option = 'slave'
    if diff < 0:
        per = diff * 100 / AmountBetPos["slave"]
        if per < -max_diff_per:
            buy_option = 'master'

    # if diff > 0:
    #     per = diff * 100 / AmountBetPos["master"];
    #     if per <= positive_max_per and per >= positive_min_per:
    #         buy_option = 'master'
    # if diff < 0:
    #     per = -diff * 100 / AmountBetPos["slave"]
    #     if per <= positive_max_per and per >= positive_min_per:
    #         buy_option = 'slave'

    if buy_option == 'master':
        pyautogui.click(MasterClickPos["x"], MasterClickPos["y"])
        pyautogui.click(ConfirmClickPos["x"], ConfirmClickPos["y"])
        write_log("set master, amount bet=%f %f, diff=%f, per=%f, and sleep %d, last=%f %f" % (
        data[0], data[1], diff, per, CountDownPos["result"], last_master, last_slave))
    elif buy_option == 'slave':
        pyautogui.click(SlaveClickPos["x"], SlaveClickPos["y"])
        pyautogui.click(ConfirmClickPos["x"], ConfirmClickPos["y"])
        write_log("set slave, amount bet=%f %f, diff=%f, per=%f, and sleep %d, last=%f %f" % (data[0], data[1], diff, per, CountDownPos["result"], last_master, last_slave))
    else:
        write_log("amount bet=%f %f, diff=%f, per=%f, not satisfy condition, ignore, last=%f %f" % (data[0], data[1], diff, per, last_master, last_slave))

    last_master = last_slave = 0
    time.sleep(CountDownPos["result"])





