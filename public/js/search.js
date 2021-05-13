function makeSearch() {
    var q=$('#srchVal').val();
    console.log(`u srchd ${q}`);
    window.location.href =`http://localhost:3000/search?q=${q}`;
      
}










$('#srchBox').on('keypress', function (e)
{
  if(e.which==13)
  makeSearch();

}
);
$('.srchIcon').on('click', function(){

    makeSearch();
      
   
})