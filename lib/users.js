exports.createUserFromTwitterData = function (twitterData) {
    return {
        id: twitterData.id
      , name: twitterData.name
    };
};
