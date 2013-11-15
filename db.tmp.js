db.users.update({}, { "$set": {settings:{mainboard_set : 'left', send_shortcut : 1}}},false, true);

db.users.update({}, { "$unset":{settings:1},false, true);

db.users.update({ip:'10.13.50.92'},{"$set":{'settings.send_shortcut':1}});

db.users.find({ip:"10.13.50.92"}, {"settings" : 1, "_id" : 0});

db.users.update({ip:'10.13.50.154'}, {'$set' : {signtrue:'云妈的默认签名'}});