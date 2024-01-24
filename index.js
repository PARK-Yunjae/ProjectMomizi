// Trigger
$('.trigger').on("click", function () {
    $(this).toggleClass('active')
    $('.menu').toggleClass('active')
})
$('.menu a').on("click", function () {
    $('.menu, .trigger').removeClass('active')
})