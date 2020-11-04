db = connect('localhost:27017/fit1');

db.users.createIndex({'email':1});
db.users.createIndex({'role':1});

db.classes.createIndex({'students':1});
db.classes.createIndex({'exercises':1});
db.classes.createIndex({'classId':1});

db.works.createIndex({'class':1});
db.works.createIndex({'title':1});
db.works.createIndex({'student':1});
db.works.createIndex({'updatedAt':1});

db.runs.createIndex({'updatedAt':1});

db.worklogs.createIndex({'student':1});
db.worklogs.createIndex({'student':1,'updatedAt':1});

db.runlogs.createIndex({'student':1});
db.runlogs.createIndex({'student':1,'updatedAt':1});

db.testlogs.createIndex({'student':1});
db.testlogs.createIndex({'student':1,'updatedAt':1});