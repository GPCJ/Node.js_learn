var router = require('express').Router(); // express라이브러리에서 Router()함수를 불러와 쓴다는 뜻

// app대신에 router를 써야함
router.get('/shirts', function(req, res){
    res.send('셔츠 파는 페이지');
})

router.get('/pants', function(req, res){
    res.send('바지 파는 페이지');
})

module.exports = router;