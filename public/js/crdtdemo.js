/*
* Client-side JavaScript to handle AJAX commands
*
*/


function countClick(countid){
  $.ajax({
    type: 'POST',
    url: '/decrcount',
    dataType: 'json',
    data: {
      id: countid},
    success: function( result ) {
    }
  });

}


function getCount(id){
  $.ajax({
    type: 'GET',
    url: '/getcount',
    dataType: 'json',
    data: {
      id: "count"+id},
    success: function( result ) {
      if (result <= 0) {
        $("#count"+id).removeClass("text-dark");
        $("#count"+id).addClass("text-danger");
        $("#count"+id).html("Sold out");
        $("#button"+id).attr("disabled", true);
      } else {
        $("#count"+id).html(result + " available");
      }
        
    }
  });
}
