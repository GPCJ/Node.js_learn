var router = require('express').Router(); // express라이브러리에서 Router()함수를 불러와 쓴다는 뜻

function login_confrim(req, res, next){
    if(req.user){
        next()
    } else {
        res.send("<script>alert('로그인 해주세요.')</script>");
    }
}

router.get('/sports', login_confrim, function(req, res){
    res.send('스포츠 게시판')
})

router.get('/game', login_confrim, function(req, res){
    res.send('게임 게시판')
})

module.exports = router;
