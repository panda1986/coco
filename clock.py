#!python
# -*- coding: utf-8 -*-

import time, pyautogui

now = int(time.time())
next = now + 30

while True:
    now = int(time.time())
    if now >= next:
        tt = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
        source = "./imgs/record_%s.png" % (tt)
        pyautogui.screenshot(source)
        next = next + 1800
    time.sleep(5)
