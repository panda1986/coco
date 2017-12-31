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

'''
If you want the crop rectangle to start at top corner X: 50 Y: 100 and the crop rectangle to be of size W: 640 H:480, then use the command:
convert foo.png -crop 640x480+50+100 out.png
'''
def convert(pos, postfix, source):
    #if os.path.exists(pos["pngName"]):
        #os.remove(pos["pngName"])
    cmd = 'convert %s -crop %dx%d+%d+%d %s' % (source, pos["w"], pos["h"], pos["x"], pos["y"], postfix + pos["pngName"]);

    (code, stdout_str, stderr_str) = run_process_instant_read_output(cmd, timeout=60);

    if code != 0:
        code = system_convert_crop_png_error;
        print("convert crop error, cmd=%s, code=%d" % (cmd, code));
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
    Lim.save(name + '_''fun_Level.png')
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
    return final

# should sleep some seconds to prepare page
start_sleep = 10
write_log("sleep %d seconds to capture" % (start_sleep))
time.sleep(start_sleep)

CountDownPos = {
    "x": 130 * 2,
    "y":120 * 2,
    "w": 83 * 2,
    "h":33 * 2,
    "pngName": "count_down.png",
    "result": 0,
}

AmountBetPos = {
    "x": 1171 * 2,
    "y":97 * 2,
    "w": 74 * 2,
    "h":35 * 2,
    "pngName": "amount_bet.png",
    "result": []
}

MasterClickPos = {
    "x": 752,
    "y": 563
}

SlaveClickPos = {
    "x": 739,
    "y": 599
}

ConfirmClickPos = {
    "x": 659,
    "y": 660
}

pyautogui.PAUSE = 1

while True:
    tt = time.strftime('%Y%m%d%H%M%S',time.localtime(time.time()))
    source = "./imgs/whole_%s.png" % (tt)
    im = pyautogui.screenshot(source)
    write_log("screen shot %s success" % (source))

    code = convert(CountDownPos, tt, source)
    if code != error_success:
        write_log("convert crop count down failed, loop continue")
        continue

    code = convert(AmountBetPos, tt, source)
    if code != error_success:
        write_log("convert crop amount bet failed, loop continue")
        continue

    res = image_to_string(tt + CountDownPos["pngName"], plus="-psm 7")
    if len(res) == 0:
        write_log("ocr count down text failed, loop continue")
        continue

    try:
        CountDownPos["result"] = int(res)
    except Exception, ex:
        write_log("parse count down text to int failed, exception, ex=%s, stack=%s, loop continue" % (ex, traceback.format_exc()))
        continue
    finally:
        pass

    write_log("ocr count down success, count down=%d" % (CountDownPos["result"]))

    final = deal_img(tt + AmountBetPos["pngName"])
    res = image_to_string(final, plus="-l eng")
    if len(res) == 0:
        write_log("ocr amount bet text failed, loop continue")
        continue

    values = res.split('\n')
    print "ocr %s success, res=%s" % (final, values)
    # decode_bet = True
    # for v in values:
    #     print "amount item=", v
    #     for k in range(len(v)):
    #         if not v[k].isdigit() and v[k] != '.':
    #             v = v[:k]
    #             break
    #     print "after deal, amount item=", v
    #     if len(v) > 0:
    #         try:
    #             AmountBetPos["result"].append(float(v))
    #         except Exception, ex:
    #             write_log("parse amount bet to float failed, exception, ex=%s, stack=%s, loop continue" % (ex, traceback.format_exc()))
    #             decode_bet = False
    #         finally:
    #             pass
    #
    # if not decode_bet:
    #     continue
    #
    # if len(AmountBetPos["result"]) != 2:
    #     write_log("ocr amount bet detail number failed, loop continue")
    #     continue
    #
    # write_log("ocr amount bet detail success, amount bet=%s" % (AmountBetPos["result"]))

    '''#check if need buy
    condition = False

    #comput buy master or slave
    buy_option = 'master' # slave

    if condition:
        print "need buy, buy option=", buy_option
        if buy_option == 'master':
            pyautogui.click(MasterClickPos["x"], MasterClickPos["y"])
        else:
            pyautogui.click(SlaveClickPos["x"], SlaveClickPos["y"])
        pyautogui.click(ConfirmClickPos["x"], ConfirmClickPos["y"])
    '''




