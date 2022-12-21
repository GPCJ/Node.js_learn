require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const methodOverrride = require('method-override');
const { name } = require('ejs');
app.use(methodOverrride('_method'))

app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

const MongoClient = require('mongodb').MongoClient;
// .env 적용
var db;
MongoClient.connect(process.env.DB_URL, function(err, client){
if (err) return console.log(err)
db = client.db('Node_learn');
app.listen(process.env.PORT, function() {
    console.log('listening on 8080')
})

    // multer 세팅
    let multer = require('multer');
    var storage = multer.diskStorage({
        destination : function(req, file, cb){
            cb(null, './public/images')
        },
        filename : function(req, file, cb){
            cb(null, file.originalname)     // 파일명 그대로 저장
        }
    });

    var upload = multer({storage : storage});


    // 파일 업로드 - start
    app.get('/upload', function(req, res){
        res.render('upload.ejs')
    })
    
    app.post('/upload', upload.single('img'), function(req, res){   // 여러 개의 파일을 받고 싶으면 single을 array로 변경해야 하고 html파일에서 input 태그 부분에 속성들을 변경해야 한다.
        res.send('업로드 완료')
    })
    // 파일 업로드 - end


    // 렌딩페이지
    app.get('/', function(req, res){         // req(request) = 요청, res(response) = 응답
        res.render('Home.ejs')               // Home.ejs파일을 띄운다, Home.ejs로 메인 페이지로 한다 여기서 이후에 만들 모든 페이지로 이동하게 만들 예정
    });
    
    // 목록 페이지
    app.get('/list', function(req, res){      // 할일 목록 페이지
        db.collection('post').find().toArray(function(error, 결과){    // DB에서 데이터를 가져옴
            console.log(결과);
            res.render('list.ejs', { posts : 결과 });                  // ejs파일에 데이터를 불러옴
        });             
    });

    // session방식 로그인 구현
    const passport = require('passport');
    const LocalStrategy = require('passport-local').Strategy;
    const session = require('express-session');

    app.use(session({secret : 'admin1234', resave : true, saveUninitialized: false}));
    app.use(passport.initialize());
    app.use(passport.session()); 


    // 로그인 처리
    // get요청
    app.get('/login', function(req, res){
        res.render('login.ejs')
    })

    // post요청
    app.post('/login', passport.authenticate('local', {
        failureRedirect : '/fail'   // 로그인 실패
    }), function(req, res){
        res.setHeader('Set-Cookie', 'login=true');
        res.redirect('/')           // 로그인 성공
    })

    app.get('/fail', function(req, res){
        res.send("<script>alert('존재하지 않는 계정입니다.'); window.location.replace('/login')</script>")
    })

    passport.use(new LocalStrategy({
        usernameField: 'ID',    // ejs에서 name 속성에 넣은 이름
        passwordField: 'PW',    // ejs에서 name 속성에 넣은 이름
        session: true,
        passReqToCallback: false,   // 아이디, 비번 이외의 정보를 검증하고 싶을 때 쓰는거임

    // ID, PW 인증 코드
    }, function (입력한아이디, 입력한비번, done) {
        //console.log(입력한아이디, 입력한비번);
        db.collection('login').findOne({ id: 입력한아이디 }, function (error, 결과) {
        if (error) return done(error)
    
        if (!결과) return done(null, false, { message: '존재하지않는 아이디입니다.' })
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비밀번호가 틀렸습니다.' })
        }
        })
    }));

    // 로그인 확인 후 알림창 띄우고 로그인 페이지로 이동
    function login_confrim_alert(req, res, next){
        if(req.user){
            next()
        } else {
            res.send("<script>alert('로그인을 진행해주세요.'); window.location.replace('/login')</script>")
        }
    }
    
    app.get('/write', login_confrim_alert, function(req, res){         // /write라는 URL를 추가해서 접속하면 밑에 있는 코드를 실행
        res.render('write.ejs')  // write.ejs파일을 띄운다.
    });

    // 사용자 정보를 세션에 아이디로 저장
    passport.serializeUser(function (user, done) {
        done(null, user.nick_name)  /** 로그인 유저의 닉네임 정보를 가지고 오고 싶으면 이런식으로 user.nick_name, ID를 가져오고 싶다면 user.id 그리고 이 정보를 밑에 함수의 info라는 파라미터에 전송 */ 
    });
    
    // 유저의 특정 정보는 가져옴
    passport.deserializeUser(function (info, done) {
        db.collection('login').findOne({nick_name : info},  function(error, 결과){  /** findOne으로 로그인한 유저의 닉네임을 nick_name필드에서 찾음, 찾은 정보를 done을 통해 보냄 이 정보는 req.user라는 코드를 적어주어야함 */
            done(null, 결과)
        })
    }); 

    // 회원가입 - start
    app.get('/register', function(req, res){
        res.render('register.ejs')
    })

    app.post('/register', function(req, res){
    db.collection('login').findOne( {id : req.body.ID, pw : req.body.PW, nick_name : req.body.nickname}, function(error, 결과){
        if(!req.body.ID || !req.body.PW || !req.body.nickname){
            res.send('모두 입력해주세요.')
        }
        else if(결과){
            res.send('이미 존재하는 ID입니다.')
        }
        else{
            db.collection('login').insertOne( { id : req.body.ID, pw : req.body.PW, nick_name: req.body.nickname }, function(error, 결과){
                res.redirect('/')  
            })
        }
    })
    })
    // 회원가입 - end

    // 게시물 추가
    app.post('/add', login_confrim_alert, function(req, res){
        
        req.user.nick_name
        db.collection('Work_ID').findOne({name : '게시물갯수'}, function(error, 결과){  // 데이터 ID 콜렉션 찾아옴
            var 총게시물갯수 = 결과.totalPost;
            var req_data = { _id : 총게시물갯수 + 1, 작성자 : req.user.nick_name, 할일 : req.body.work, 날짜 : req.body.date }

            db.collection('post').insertOne( req_data , function(error, 결과){
                res.redirect('/list')
                console.log('저장완료');
                db.collection('Work_ID').updateOne({name : '게시물갯수'}, { $inc : {totalPost:1} }, function(error, 결과){      // 할일 ID 1씩증가
                    if(error){return console.log(error)}
                });
            });
        });
    }); 

    // 마이페이지
    app.get('/mypage', login_confrim_alert, function(req, res){
        res.render('my_page.ejs')
    })



    // 삭제 기능 - start
    app.delete('/delete', function(req, res){
        req.body._id = parseInt(req.body._id)   // Int형으로 변환해서 저장

        req.user.nick_name
        var 삭제할데이터 = { nick_name : req.body.nick_name, 작성자 : req.user.nick_name}

        // req.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주어야함
        db.collection('post').deleteOne(삭제할데이터, function(error, 결과){
            console.log('삭제완료');
        });
    });
    
    app.get('/detail/:id', function(req, res){ 
        db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(error, 결과){
            if (!결과){
                res.send('존재하지 않는 페이지입니다.')
            }

            res.render('detail.ejs', { data : 결과 })

            
        })
      });
    // 삭제 기능 - end

    // 수정 페이지 이동
    app.get('/edit/:id', function(req, res){ 
        req.user.nick_name
        var 삭제할데이터 = { nick_name : req.body.nick_name, 작성자 : req.user.nick_name}
        db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(error, 결과){
            if (!결과){
                res.send('존재하지 않는 페이지입니다.')
            }

            res.render('edit.ejs', { data : 결과 })
        })
      });

    
    // 수정 데이터 업데이트
    app.put('/edit', function(req, res){
        db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set : { 할일 : req.body.work, 날짜 : req.body.date }}, function(error, 결과){
            console.log('수정완료');
            res.redirect('/list')
        });
    });

    


    // 검색 키워드 처리
    app.get('/search', function(req, res){
    var 검색조건 = [
        {
            $search: {
            index: 'title_search',
            text: {
                query: req.query.value,
                path: '할일'  // 찾고 싶은 필드 넣으면됨, 여러개면 이런식으로 ['제목', '날짜']
            }
            }
        },
        ] 
        
    db.collection('post').aggregate(검색조건).toArray(function(error, 결과){   // post테이블 안에서 할일 필드에 있는 값중에 req.query.value에 해당하는 게시물들을 가져옴
        res.render('work_search.ejs', { result : 결과 });             
    })
    })

    
app.use('/shop', require('./routes/shop.js'))        // routes -> shop.js

app.use('/board/sub', require('./routes/board.js'))  // routes -> board.js
    
























































});