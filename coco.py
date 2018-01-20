#!python
# -*- coding: utf-8 -*-

import pyautogui
import time, traceback
import htc_utility
import htc_constant

# should sleep some seconds to prepare page

start_sleep = 10
pyautogui.PAUSE = 0.3
pyautogui.FAILSAFE = False
max_data_error_diff = 1000000
check_data_change_interval = 300000
max_diff_per = 35
positive_max_per = 30
positive_min_per = 5
htc_utility.write_log("sleep %d seconds to capture" % (start_sleep))
time.sleep(start_sleep)

while True:
    (valid, count_down, master, slave) = htc_utility.do_cycle()
    if not valid:
        if count_down <= 0:
            res = list(pyautogui.locateAllOnScreen(htc_constant.EnterPng))
            if len(res) > 0:
                htc_utility.write_log("has enter, click to enter game, and mouse move to origin")
                pyautogui.click(htc_constant.EnterClickPos["x"], htc_constant.EnterClickPos["y"])
                pyautogui.moveTo(10, 500)
        continue

    htc_utility.write_log("count down=%d satisfy, master=%f, slave=%f, come to comput buy option" % (count_down, master, slave))
    buy_option = ''
    per = 0
    # if master-slave > 10W set slave; if master - slave < -10W, set master; if diff > 100W， data error
    diff = master - slave
    # if diff > max_data_error_diff or diff < -max_data_error_diff:
    #     write_log("amount bet=%f %f invalid, diff to large, ignore this" % (data[0], data[1]))
    #     continue

    if diff > 0:
        per = diff * 100 / master;
        if per > max_diff_per:
            buy_option = 'slave'
    if diff < 0:
        per = diff * 100 / slave
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
        pyautogui.click(htc_constant.MasterClickPos["x"], htc_constant.MasterClickPos["y"])
        pyautogui.click(htc_constant.ConfirmClickPos["x"], htc_constant.ConfirmClickPos["y"])
        htc_utility.write_log("set master, amount bet=%f %f, diff=%f, per=%f, and sleep %d" % (
        master, slave, diff, per, htc_constant.CountDownPos["result"]))
    elif buy_option == 'slave':
        pyautogui.click(htc_constant.SlaveClickPos["x"], htc_constant.SlaveClickPos["y"])
        pyautogui.click(htc_constant.ConfirmClickPos["x"], htc_constant.ConfirmClickPos["y"])
        htc_utility.write_log("set slave, amount bet=%f %f, diff=%f, per=%f, and sleep %d" % (master, slave, diff, per, htc_constant.CountDownPos["result"]))
    else:
        htc_utility.write_log("amount bet=%f %f, diff=%f, per=%f, not satisfy condition, ignore" % (master, slave, diff, per))

    time.sleep(2)
    (final_master, final_slave) = htc_utility.get_final_master_slave()
    htc_utility.write_log("get final master=%f, slave=%s" % (final_master, final_slave))
    # get final master, slave

    time.sleep(5)
    account_value = -1
    while True:
        tt = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
        source = "./imgs/whole_%s.png" % (tt)
        im = pyautogui.screenshot(source)
        count_down = htc_utility.deal_count_down(source)
        if count_down <= 0:
            htc_utility.write_log("count_down=%d may be 结算中, continue to wait"%(count_down))
            htc_utility.clear(source, htc_constant.CountDownPos["pngName"], "", "")
            res = list(pyautogui.locateAllOnScreen(htc_constant.EnterPng))
            if len(res) > 0:
                htc_utility.write_log("has enter, click to enter game, and mouse move to origin")
                pyautogui.click(htc_constant.EnterClickPos["x"], htc_constant.EnterClickPos["y"])
                pyautogui.moveTo(10, 500)
            continue

        htc_utility.write_log("next count down=%d, come to get account value, and insert into sql" % (count_down))
        account_value = htc_utility.deal_account_value(source)
        htc_utility.clear(source, htc_constant.CountDownPos["pngName"], "", "")
        htc_utility.clear_account(htc_constant.AccountValuePos["pngName"])
        if account_value >= 0:
            htc_utility.write_log("get account value=%d" % (account_value))
        else:
            htc_utility.write_log("get account failed, value=%d" % (account_value))
        # snap, get count_down, if count_down > 0; get account_value;break
        # get account value
        break

    req = {
        "buy_option": buy_option,
        "set_master": master,
        "set_slave": slave,
        "actual_master": final_master,
        "actual_slave": final_slave,
        "account_value": account_value
    }
    (code, id) = htc_utility.insert_coco_item(req)
    if code != htc_utility.error_success:
        htc_utility.write_log("insert info mysql failed")
    else:
        htc_utility.write_log("insert into mysql success, id=%d" % (id))


    # tt = time.strftime('%Y%m%d%H%M%S',time.localtime(time.time()))
    # source = "./imgs/whole_%s.png" % (tt)
    # im = pyautogui.screenshot(source)
    # #write_log("screen shot %s success" % (source))
    #
    # CountDownPos["pngName"] = "./imgs/" + tt + "count_down.png"
    # code = htc_utility.convert(CountDownPos, source)
    # if code != htc_utility.error_success:
    #     htc_utility.write_error_log("convert crop count down failed, loop continue")
    #     htc_utility.clear(source, "", "", "")
    #     continue
    #
    # res = htc_utility.image_to_string(CountDownPos["pngName"], plus="-psm 7")
    # if len(res) == 0:
    #     htc_utility.write_error_log("ocr count down text failed, loop continue")
    #     htc_utility.clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], "")
    #     res = list(pyautogui.locateAllOnScreen('enter.png'))
    #     if len(res) > 0:
    #         htc_utility.write_log("has enter, click to enter game, and mouse move to origin")
    #         last_master = last_slave = 0
    #         pyautogui.click(EnterClickPos["x"], EnterClickPos["y"])
    #         pyautogui.moveTo(10, 500)
    #     continue
    #
    # try:
    #     CountDownPos["result"] = int(res)
    # except Exception, ex:
    #     htc_utility.write_error_log("parse count down text to int failed, exception, ex=%s, stack=%s, loop continue" % (ex, traceback.format_exc()))
    #     htc_utility.clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], "")
    #     res = list(pyautogui.locateAllOnScreen('enter.png'))
    #     if len(res) > 0:
    #         htc_utility.write_log("has enter, click to enter game, and mouse move to origin")
    #         last_master = last_slave = 0
    #         pyautogui.click(EnterClickPos["x"], EnterClickPos["y"])
    #         pyautogui.moveTo(10, 500)
    #     continue
    # finally:
    #     pass
    #
    # #check if need buy
    # if CountDownPos["result"] > min_count_down or CountDownPos["result"] < 0:
    #     htc_utility.clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], "")
    #     htc_utility.write_log("count down=%d not staisfy, ignore, last=%f %f" % (CountDownPos["result"], last_master, last_slave))
    #     continue
    #
    # AmountBetPos["pngName"] = "./imgs/" + tt + "amount_bet.png"
    # code = htc_utility.convert(AmountBetPos, source)
    # if code != htc_utility.error_success:
    #     htc_utility.write_error_log("convert crop amount bet failed, loop continue")
    #     htc_utility.clear(source, CountDownPos["pngName"], "", "")
    #     continue
    #
    # middle, final = htc_utility.deal_img(AmountBetPos["pngName"])
    # htc_utility.write_log("deal amountbet success, generate final png")
    # res = htc_utility.image_to_string(final, plus="-l eng")
    # if len(res) == 0:
    #     htc_utility.write_error_log("ocr amount bet text failed, loop continue")
    #     htc_utility.clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], middle)
    #     continue
    #
    # htc_utility.clear(source, CountDownPos["pngName"], AmountBetPos["pngName"], middle)
    # values = res.split('\n')
    # decode_bet = True
    # data = []
    # for v in values:
    #     for k in range(len(v)):
    #         if not v[k].isdigit() and v[k] != '.':
    #             v = v[:k]
    #             break
    #     if len(v) > 0:
    #         try:
    #             data.append(float(v))
    #         except Exception, ex:
    #             htc_utility.write_error_log("parse amount bet to float failed, exception, ex=%s, stack=%s, loop continue" % (ex, traceback.format_exc()))
    #             decode_bet = False
    #         finally:
    #             pass
    #
    # if not decode_bet:
    #     continue
    #
    # if len(data) != 2:
    #     htc_utility.write_error_log("ocr amount bet detail number failed, ori=%s, res=%s loop continue" % (values, data))
    #     continue
    #
    # htc_utility.clear_final(final)
    # AmountBetPos["master"] = data[0]
    # AmountBetPos["slave"] = data[1]
    # htc_utility.write_log("ocr amount bet detail success, amount bet=%f %f" % (data[0], data[1]))

    # # if master-slave > 10W set slave; if master - slave < -10W, set master; if diff > 100W， data error
    # diff = AmountBetPos["master"] - AmountBetPos["slave"]
    # # if diff > max_data_error_diff or diff < -max_data_error_diff:
    # #     write_log("amount bet=%f %f invalid, diff to large, ignore this" % (data[0], data[1]))
    # #     continue
    #
    # buy_option = ''
    # per = 0
    #
    # #if diff >0, diffPer = diff * 100 / master; diffPer > 40; set slave
    # if diff > 0:
    #     per = diff * 100 / AmountBetPos["master"];
    #     if per > max_diff_per:
    #         buy_option = 'slave'
    # if diff < 0:
    #     per = diff * 100 / AmountBetPos["slave"]
    #     if per < -max_diff_per:
    #         buy_option = 'master'
    #
    # # if diff > 0:
    # #     per = diff * 100 / AmountBetPos["master"];
    # #     if per <= positive_max_per and per >= positive_min_per:
    # #         buy_option = 'master'
    # # if diff < 0:
    # #     per = -diff * 100 / AmountBetPos["slave"]
    # #     if per <= positive_max_per and per >= positive_min_per:
    # #         buy_option = 'slave'

    # if buy_option == 'master':
    #     pyautogui.click(MasterClickPos["x"], MasterClickPos["y"])
    #     pyautogui.click(ConfirmClickPos["x"], ConfirmClickPos["y"])
    #     htc_utility.write_log("set master, amount bet=%f %f, diff=%f, per=%f, and sleep %d" % (
    #     data[0], data[1], diff, per, CountDownPos["result"]))
    # elif buy_option == 'slave':
    #     pyautogui.click(SlaveClickPos["x"], SlaveClickPos["y"])
    #     pyautogui.click(ConfirmClickPos["x"], ConfirmClickPos["y"])
    #     htc_utility.write_log("set slave, amount bet=%f %f, diff=%f, per=%f, and sleep %d" % (data[0], data[1], diff, per, CountDownPos["result"]))
    # else:
    #     htc_utility.write_log("amount bet=%f %f, diff=%f, per=%f, not satisfy condition, ignore" % (data[0], data[1], diff, per))
    #
    #
    # #htc_utility.insert_coco_item()
    # time.sleep(CountDownPos["result"])





