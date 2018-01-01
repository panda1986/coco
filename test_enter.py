import pyautogui
from PIL import Image
import time

# print "time sleep 5 seconds..."
# time.sleep(5)
# source = "./whole.png"
# pyautogui.screenshot(source)
# im = Image.open(source)
# box = (1186, 894, 1318, 934)
# region = im.crop(box)
# region.save('./enter.png')

print "sleep 5 seconds..."
time.sleep(5)
print list(pyautogui.locateAllOnScreen('enter.png'))