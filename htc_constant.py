#!python
# -*- coding: utf-8 -*-
import pyautogui

class Constants:
    Screen15Config = {
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
            "y":110 * 2,
            "w": 134 * 2,
            "h":24 * 2,
            "pngName": "imgs/account.png",
        }
    }
    Screen13Config = {
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

min_count_down = 5
last_account_value = -1

sc = Constants.Screen15Config
screenWidth, screenHeight = pyautogui.size()
if screenWidth == 1280:
    sc = Constants.Screen13Config
elif screenWidth == 2048:
    sc = Constants.ScreenImacConfig

CountDownPos = sc["CountDownPos"]
AmountBetPos = sc["AmountBetPos"]
MasterClickPos = sc["MasterClickPos"]
SlaveClickPos = sc["SlaveClickPos"]
ConfirmClickPos = sc["ConfirmClickPos"]
EnterClickPos = sc["EnterClickPos"]
EnterPng = sc["EnterPng"]
AccountValuePos = sc["AccountValuePos"]


