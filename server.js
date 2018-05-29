const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
app.use(session({saveUninitialized: true, secret: "supersecret", resave: false}));

mongoose.connect('mongodb://localhost/dojo_message_board');

const CommentSchema = new mongoose.Schema({
  name: {type: String, required: [true, "Comment_name is requried!"], minlength: [3, "Comment_name must include atleast 3 characters!"]},
  content: {type: String, required: [true, "Comment_content is required!"], minlength: [3, "Comment_content must include atleast 3 characters!"]}
}, {timestamps: true});

const MessageSchema = new mongoose.Schema({
  name: {type: String, required: [true, "Message_name is required!"], minlength: [3, "Message_name must include atleast 3 characters"]},
  content: {type: String, required: [true, "Message_content is required!"], minlength: [3, "Message_content must be atleast 3 characters!"]},
  comments: [CommentSchema],
}, {timestamps: true});

mongoose.model("Message", MessageSchema);
mongoose.model("Comment", CommentSchema);

const Message = mongoose.model("Message");
const Comment = mongoose.model("Comment");

app.get('/', (req, res)=>{
  Message.find({}, (err, messages)=>{
    if(err){
      console.log('Error during DB query!');
    }
    else{
      console.log('DB queried successfully!');
    }

    res.render('index', {'board_messages': messages});
  });
});

app.post('/message', (req, res)=>{
  let message = new Message({
    name: req.body.message_name,
    content: req.body.message_content,
    comments: []
  });

  message.save(err=>{
    if(err){
      console.log('Error saving message!');

      for(var error in err.errors){
        req.flash("message_errors", error.message);
      }
    }
    else{
      console.log('message saved successfully!');
    }

    res.redirect('/');
  });
});

app.post('/comment/:id', (req, res)=>{
  let comment = new Comment({
    name: req.body.comment_name,
    content: req.body.comment_content
  });

  Message.findByIdAndUpdate(req.params.id, {$push: {comments: comment}}, {runValidators: true},(err, status)=>{
    if(err){
      console.log('Error adding comment to message');

      for(var error of err.errors){
        req.flash("message_errors", error.message);
      }

    }else{
      console.log('Comment added successfully!');
    }

    res.redirect('/');
  })
});

app.listen(7777, function(){
  console.log('Express app listening on port 7777');
});