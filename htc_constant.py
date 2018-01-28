#!python
# -*- coding: utf-8 -*-
import pyautogui

class Constants:
    max_diff_per = 35
    positive_max_per = 25
    positive_min_per = 5
    strategy_full_min_diff = 30000

    Screen15Config = {
        "200buttonPos": {
            "x": 1406,
            "y": 858
        },
        "1000buttonPos": {
            "x": 1563,
            "y": 849
        },
        "RefreshPos": {
            "x": 76,
            "y": 57
        },
        "CountDownPos": {
            "x": 130 * 2,
            "y":105 * 2,
            "w": 119 * 2,
            "h":47 * 2,
            "pngName": "./imgs/count_down.png",
            "result": 0
        },
        "AmountBetPos": {
            "x": 1564 * 2,
            "y":78 * 2,
            "w": 120 * 2,
            "h":50 * 2,
            "pngName": "./imgs/amount_bet.png",
            "master": 0,
            "slave": 0
        },
        "MasterClickPos": {
            "x": 865,
            "y": 714
        },
        "SlaveClickPos": {
            "x": 855,
            "y": 778
        },
        "ConfirmClickPos": {
            "x": 890,
            "y": 858
        },
        "EnterClickPos": {
            "x": 800,
            "y": 570
        },
        "EnterPng": "enter.png",
        "AccountValuePos": { #需计算
            "x": 1297 * 2,
            "y":108 * 2,
            "w": 115 * 2,
            "h":21 * 2,
            "pngName": "imgs/account.png",
        }
    }
    Screen13Config = {
        "200buttonPos": {
            "x": 1406,
            "y": 858
        },
        "1000buttonPos": {
            "x": 1563,
            "y": 849
        },
        "RefreshPos": { #need to re comput
            "x": 76,
            "y": 57
        },
        "CountDownPos": {
            "x": 130 * 2,
            "y":120 * 2,
            "w": 83 * 2,
            "h":33 * 2,
            "pngName": "imgs/count_down.png",
            "result": 0,
        },
        "AmountBetPos": {
            "x": 1171 * 2,
            "y":97 * 2,
            "w": 74 * 2,
            "h":35 * 2,
            "pngName": "imgs/amount_bet.png",
            "master": 0,
            "slave": 0
        },
        "MasterClickPos": {
            "x": 752,
            "y": 563
        },
        "SlaveClickPos": {
            "x": 739,
            "y": 599
        },
        "ConfirmClickPos": {
            "x": 659,
            "y": 660
        },
        "EnterClickPos": {
            "x": 600,
            "y": 452
        },
        "EnterPng": "enter_13.png",
        "AccountValuePos": {
            "x": 970 * 2,
            "y":122 * 2,
            "w": 95 * 2,
            "h":17 * 2,
            "pngName": "imgs/account.png",
        }
    }
    ScreenImacConfig = {
        "200buttonPos": {
            "x": 1406,
            "y": 858
        },
        "1000buttonPos": {
            "x": 1563,
            "y": 849
        },
        "RefreshPos": { #need to re comput
            "x": 76,
            "y": 57
        },
        "CountDownPos": {
            "x": 236 * 2,
            "y":109 * 2,
            "w": 132 * 2,
            "h":47 * 2,
            "pngName": "count_down.png",
            "result": 0
        },
        "AmountBetPos": {
            "x": 1818 * 2,
            "y":78 * 2,
            "w": 132 * 2,
            "h":54 * 2,
            "pngName": "amount_bet.png",
            "master": 0,
            "slave": 0
        },
        "MasterClickPos": {
            "x": 1047,
            "y": 784
        },
        "SlaveClickPos": {
            "x": 1042,
            "y": 861
        },
        "ConfirmClickPos": {
            "x": 1083,
            "y": 945
        },
        "EnterClickPos": {
            "x": 988,
            "y": 624
        },
        "EnterPng": "enter_imac.png",
        "AccountValuePos": {
            "x": 1527 * 2,
            "y":111 * 2,
            "w": 141 * 2,
            "h":28 * 2,
            "pngName": "imgs/account.png",
        }
    }

def strategy_full(master, slave):
    per = 0
    option = ''
    diff = master - slave
    if diff > Constants.strategy_full_min_diff:
        option = 'slave'
    if diff < -Constants.strategy_full_min_diff:
        option = 'master'
    return (diff, per, option)


def strategy_positive(master, slave):
    diff = master - slave
    per = 0
    option = ''
    if diff > 0:
        per = diff * 100 / master
        if per > Constants.max_diff_per:
            option = 'slave'
    if diff < 0:
        per = diff * 100 / slave
        if per < -Constants.max_diff_per:
            option = 'master'
    return (diff, per, option)


def strategy_negative(master, slave):
    diff = master - slave
    per = 0
    option = ''
    if diff > 0:
        per = diff * 100 / master;
        if per <= Constants.positive_max_per and per >= Constants.positive_min_per:
            option = 'master'
    if diff < 0:
        per = -diff * 100 / slave
        if per <= Constants.positive_max_per and per >= Constants.positive_min_per:
            option = 'slave'
    return (diff, per, option)


min_count_down = 6
last_account_value = -1

sc = Constants.Screen15Config
screenWidth, screenHeight = pyautogui.size()
if screenWidth == 1280:
    sc = Constants.Screen13Config
elif screenWidth == 2048:
    sc = Constants.ScreenImacConfig

RefreshPos = sc["RefreshPos"]
CountDownPos = sc["CountDownPos"]
AmountBetPos = sc["AmountBetPos"]
MasterClickPos = sc["MasterClickPos"]
SlaveClickPos = sc["SlaveClickPos"]
ConfirmClickPos = sc["ConfirmClickPos"]
EnterClickPos = sc["EnterClickPos"]
EnterPng = sc["EnterPng"]
AccountValuePos = sc["AccountValuePos"]
ButtonLevelPos = sc["1000buttonPos"]




