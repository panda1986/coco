from PIL import Image

#20171218112552master_bet.png
#/Users/panda/Downloads

#  load a color image
im = Image.open('/Users/panda/Downloads/20171218112552master_bet.png')

#  convert to grey level image
Lim = im.convert('L' )
Lim.save('fun_Level.png')
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

bim.save('fun_binary.jpg')