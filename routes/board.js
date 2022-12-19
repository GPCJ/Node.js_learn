var router = require('express').Router(); // express라이브러리에서 Router()함수를 불러와 쓴다는 뜻

router.get('/board/sub/sports', function(req, res){
    res.send('스포츠 게시판')
})

router.get('/board/sub/game', function(req, res){
    res.send('게임 게시판')
})

module.exports = router;
