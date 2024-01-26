// Trigger
$('.trigger').on("click", function () {
    $(this).toggleClass('active')
    $('.menu').toggleClass('active')
})
$('.menu a').on("click", function () {
    $('.menu, .trigger').removeClass('active')
})

$('main').slick({
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 3,
    autoplay: true, // 자동 스크롤 사용 여부
    autoplaySpeed: 3000, // 자동 스크롤 시 다음으로 넘어가는데 걸리는 시간 (ms)
    pauseOnHover: true, // 마우스 가져되면 멈춤 
    responsive: [{
            breakpoint: 1050,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        },
        {
            breakpoint: 767,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
        // You can unslick at a given breakpoint now by adding:
        // settings: "unslick"
        // instead of a settings object
    ]
});