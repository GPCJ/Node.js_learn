require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const methodOverrride = require('method-override')
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
    // 게시물 
    app.post('/add', function(req, res){
        res.redirect('/list')
        db.collection('Work_ID').findOne({name : '게시물갯수'}, function(error, 결과){  // 데이터 ID 콜렉션 찾아옴
            console.log(결과.totalPost)
            var 총게시물갯수 = 결과.totalPost;

            db.collection('post').insertOne( { _id : 총게시물갯수 + 1, 할일 : req.body.work, 날짜 : req.body.date } , function(error, 결과){
                console.log('저장완료');
                db.collection('Work_ID').updateOne({name : '게시물갯수'}, { $inc : {totalPost:1} }, function(error, 결과){      // 할일 ID 1씩증가
                    if(error){return console.log(error)}
                });
            });
        });
    });

    app.get('/list', function(req, res){      // 할일 목록 페이지
        db.collection('post').find().toArray(function(error, 결과){    // DB에서 데이터를 가져옴
            console.log(결과);
            res.render('list.ejs', { posts : 결과 });                  // ejs파일에 데이터를 불러옴
        });             
    });

    app.delete('/delete', function(req, res){
        req.body._id = parseInt(req.body._id)
        // 요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주어야함
        db.collection('post').deleteOne(req.body, function(error, 결과){
            console.log('삭제완료');
            res.status(200).send({message : '성공했습니다.'});
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

    // 수정 페이지 이동
    app.get('/edit/:id', function(req, res){ 
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


    app.get('/', function(req, res){              // req(request) = 요청, res(response) = 응답
        res.render('Home.ejs')  // Home.ejs파일을 띄운다, Home.ejs로 메인 페이지로 한다 여기서 이후에 만들 모든 페이지로 이동하게 만들 예정
    });

    app.get('/write', function(req, res){         // /write라는 URL를 추가해서 접속하면 밑에 있는 코드를 실행
        res.render('write.ejs')  // write.ejs파일을 띄운다.
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
        res.redirect('/')           // 로그인 성공
    })

    app.get('/fail', function(req, res){
        res.redirect('/login')
    })

    // 마이페이지 띄워주기
    app.get('/mypage', 로그인확인, function(req, res){
        res.render('my_page.ejs')
    })
    
    function 로그인확인(req, res, next){
        if(req.user){
            next()
        } else {
            res.send('로그인 해주세요')
        }
    }




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

      // ID를 이용해 세션을 저장시키는 코드
      passport.serializeUser(function (user, done) {
        done(null, user.id)
      });
      
      // 데이터를 가진 사람을 DB에서 찾아주는 코드
      passport.deserializeUser(function (아이디, done) {
        done(null, {})
      }); 


      // 검색 키워드 처리
      app.get('/search', function(req, res){
        console.log(req.query.value)  // req 즉 요청 정보에서 query string으로 보낸 데이터만 콘솔에 출력 여기서 .value이런식으로 쓰면 데이터 이름도 걸러서 그냥 단지 데이터만 가져올 수 있음
        db.collection('post').find({할일:req.query.value}).toArray(function(error, 결과){   // post테이블 안에서 할일 필드에 있는 값중에 req.query.value에 해당하는 게시물들을 가져옴
            console.log(결과)
            res.render('search_result.ejs', { result : 결과 });             
        })
      })





























































});