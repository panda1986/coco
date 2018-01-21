#!python
# -*- coding: utf-8 -*-

import htc_utility

last_account_value = 10150
(code, items) = htc_utility.items_all()
if code != 0 :
    print "get items failed"
else:
    print ("get items success, count=%d" % (len(items)))
    for i in range(len(items)):
        item = items[i]
        if i == 0:
            item["last_account_value"] = last_account_value
        else:
            item["last_account_value"] = items[i -1]["last_account_value"]

        item["state"] = 0
        diff = item["account_value"] - item["last_account_value"]
        if diff > 0:
            item["state"] = 1
        else:
            item["state"] = -1

        item["set_diff"] = item["set_master"] - item["set_slave"]
        item["actual_diff"] = item["actual_master"] - item["actual_slave"]

        htc_utility.updae_item(item)
        print ("update id=%d, last_account=%d, account=%d, state=%d, set_diff=%d, actual_diff=%d" % (
            item["id"], item["last_account_value"], item["account_value"], item["state"],
            item["set_diff"], item["actual_diff"]))

