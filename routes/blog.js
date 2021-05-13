const express = require('express');
const router = express.Router();
const Blog = require('../models/blog');
const Search = require('../models/search');

const Review = require('../models/review');
const Trending = require('../models/trending');
const TrendingTag = require('../models/trendingTag');
const TrendingWriter = require('../models/trendingWriter');
const { isLoggedIn ,isSameUserBlog} = require('../middleware');


router.get('/blogs', async(req, res) => {
    try {
    const blogs=await Blog.find({});
    var trendings =await Trending.find({}).populate('blogTrend');
    
    var mxLen = Math.min(4,trendings.length);
    
    
    trendings.sort(function(a, b){
        if(a.hit!=b.hit)
        return b.hit - a.hit
        else
        return b.day-a.day;
    
    });
    trendings= trendings.splice(0,mxLen);
    // console.log(trendings);

    trendingTags = await TrendingTag.find({});
     mxLen = Math.min(9,trendingTags.length);
    trendingTags.sort(function(a, b){
        if(a.hit!=b.hit)
        return b.hit - a.hit
        else
        return b.day-a.day;
    
    });

    trendingTags= trendingTags.splice(0,mxLen);
    trendingWriters = await TrendingWriter.find({}).populate('user');
     mxLen = Math.min(9,trendingWriters.length);
    
    trendingWriters.sort(function(a, b){
        if(a.hit!=b.hit)
        return b.hit - a.hit
        else
        return b.day-a.day;
    
    });
    
    trendingWriters= trendingWriters.splice(0,mxLen);




    // console.log(trendings);
    res.render('blogs/app',{blogs,trendings,trendingTags,trendingWriters});
    }
    catch(e){
        console.log("Something Went Wrong");
        req.flash('error', 'Cannot Find blogs');
        res.render('error');
    }
})


// Get the form for new blog
router.get('/blogs/new',isLoggedIn, (req, res) => {

    res.render('blogs/new');
})


// create new blogs
router.post('/blogs',isLoggedIn,async(req, res) => {
    try {
       
        var blogBody = {user: req.user._id, ...req.body.blog }
    var id;
    await Blog.create(blogBody).then(savedDoc => id=savedDoc.id); 
    // console.log(blogBody);
    for( var tg  of blogBody.tags)
    {
   
        var obj= await Search.findOne({tag:tg})
      
        if(obj==undefined)
        {
            var ar=[];
            ar.push(id);
            await Search.create({tag:tg,links:ar});
        }
        else
        {
            
            obj.links.push(id);
          
            obj.save();
        }
        
    }
    
    req.flash('success', 'blog Created Successfully');  
    res.status(200).send({"code":"ok"});
    }

    catch(e) {
        console.log(e.message);
        req.flash('error', 'Cannot Create blogs,Something is Wrong');
        res.render('error');
    }
});




// edit changes to a particular blog
router.put('/blogs/:id',isLoggedIn,isSameUserBlog,async(req, res) => {
    try {
    await Blog.findByIdAndUpdate(req.params.id, req.body.blog);  

    req.flash('success', 'blog edited Successfully');  
    res.status(200).send({"code":"ok"});
    }
    catch(e){
        console.log(e);
        req.flash('error', 'Cannot make updates');
        res.redirect('/error');
    }
});


// get the edit form for blogs

router.get('/blogs/:id/edit',isLoggedIn,isSameUserBlog, async(req, res) => {
    try{
        console.log(req.blog);
    // const blog=await Blog.findById(req.params.id);
    res.render('blogs/edit',{blog:req.blog});
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot Edit this blog');
        res.redirect('/error');
    }

})


//get a particular blog
router.get('/blogs/:id', async(req, res) => {
  try{
    const blog=await  Blog.findById(req.params.id).populate('reviews').populate('user');
    var currDate =new Date();
    var num = currDate.getDate();

    var trnd = await Trending.findOne({day:num,blogTrend:req.params.id})
    if(trnd==undefined)
    {
       //console.log("not found"); 
       await Trending.create({day:num,blogTrend:req.params.id,hit:1});
    }
    else
    {   //console.log(trnd);
        var nwhit=trnd.hit+1;
      await Trending.findByIdAndUpdate(trnd._id,{hit:nwhit});  
      //console.log(trnd);
    }

    for(let getTag of blog.tags)
    {
        var trndTag = await TrendingTag.findOne({day:num,tag:getTag});
         if(trndTag==undefined)
         {
            await TrendingTag.create({day:num,tag:getTag,hit:1});
            // console.log("created");
         }
         else
         {
            await TrendingTag.findByIdAndUpdate(trndTag._id,{day:num,tag:getTag,hit:trndTag.hit+1});
            // console.log(trndTag);
         }

    }
    var trndWriter = await TrendingWriter.findOne({day:num,user:blog.user._id})
    if(trndWriter==undefined)
    {
       console.log("not found"); 
       await TrendingWriter.create({day:num,user:blog.user._id,hit:1});
    }
    else
    {   //console.log(trnd);
        var nwhit=trndWriter.hit+1;
      await TrendingWriter.findByIdAndUpdate(trndWriter._id,{hit:nwhit});  
    //   console.log(trndWriter);
    } 


   res.render('blogs/show',{blog});
    } catch (e) {
        // console.log(e.message);
        req.flash('error', 'Cannot find this Blog');
        res.redirect('/error');
    }
})

router.get('/blogs',async(req, res) => {

  
        const blogs=await Blog.find({});
    
        res.render('blogs/app',{blogs});
});




// Delete a particular blog
router.delete('/blogs/:id',isLoggedIn,isSameUserBlog, async (req, res) => {

    try {
    await Blog.findByIdAndDelete(req.params.id);
  
    
    req.flash('success', 'Deleted the blog post successfully');
    res.redirect('/blogs');   
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot delete this blog Post');
        res.redirect('/error');
    }

})



// Creating a New Comment on a blog

router.post('/blogs/:id/review',isLoggedIn, async (req, res) => {
    
    try {
        // console.log("receved");
        const blog = await Blog.findById(req.params.id);
        const review = new Review({
            user: req.user.username,
            ...req.body
        });
        blog.reviews.push(review);

        await review.save();
        await blog.save();

        req.flash('success','Successfully added your comment!')
        res.redirect(`/blogs/${req.params.id}`);
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot add comment to this blog');
        res.redirect('/error');
    }
    
})


router.get('/error', (req, res) => {
    res.status(404).render('error');
})


module.exports = router;