with open('name-list') as inputfile:
    names = [name.strip() for name in inputfile.read().split('\n') if name.strip() != '']
    for name in names:
        print 'insert into employee(id) values("%s");' % name
