var users = require('../lib/users.js');

describe('users', function(){
    it('should be properly created from twitter data', function() {
        var user = users.createUserFromTwitterData({
            id:    232
          , name:  'everzet'
        });

        expect(user.id).toEqual(232);
        expect(user.name).toEqual('everzet');
    });
});
