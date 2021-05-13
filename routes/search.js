const express = require('express');
const router = express.Router();
const Search= require('../models/search');


router.get('/search',async(req, res) => {
    try {
       console.log(req.query.q);
          var srchResult=  await Search.findOne({tag:req.query.q}).populate('links');
          console.log(srchResult);
          if(!srchResult)
          {
            console.log(srchResult);
                 res.render('blogs/srchShow',{srchResult:{links:[]}});
          }
    
          res.render('blogs/srchShow',{srchResult,topic:req.query.q});
    
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Nothing mactched to your search');
        res.render('error');
    }
});

module.exports = router;