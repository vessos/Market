function startApp(){
    sessionStorage.clear();
    visionMenu();

    //Menu navigation
    $("#linkMenuAppHome").click(homeMenu);
    $("#linkMenuLogin").click(loginMenu);
    $("#linkMenuRegister").click(registerMenu);
    $("#linkMenuUserHome").click(homeUserMenu);
    $("#linkMenuShop").click(shopMenu);
    $("#linkMenuCart").click(cartMenu);
    $("#linkMenuLogout").click(logout);
    $("#linkUserHomeShop").click(shopMenu);
    $("#linkUserHomeCart").click(cartMenu);


    //Button Submit
    $("#formRegister input[type=submit]").click(registerUser);
    $("#formLogin input[type=submit]").click(loginUser);

    const kinveyBaseUrl ="https://baas.kinvey.com/";
    const kinveyAppId = "kid_rJ_VxNt4e";
    const kinveyAppSecret = "936a9c9ee4804d70b457d1a9e0f712a8";
    const kinveyAutHeaders = {"Authorization": "Basic "+btoa(kinveyAppId+":"+kinveyAppSecret)};

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show();
        },
        ajaxStop: function () {
            $("#loadingBox").hide();
        }
    });

    function visionMenu (){
        $("#menu a").hide();
        if(sessionStorage.getItem("authToken")){
            $("#linkMenuUserHome").show();
            $("#linkMenuShop").show();
            $("#linkMenuCart").show();
            $("#linkMenuLogout").show();
            $("#spanMenuLoggedInUser").show()
        }else{
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();
            $("#viewAppHome").show();
            $("#spanMenuLoggedInUser").hide()
        }
    }

    function showView(viewname){
        $('main > section').hide();
        $('#' + viewname).show();
    }

    function homeMenu(){
        showView("viewAppHome")
    }


    function loginMenu(){
        showView("viewLogin")
    }

    function registerMenu(){
        showView("viewRegister");
    }

    function homeUserMenu(){
        showView("viewUserHome");
    }

    function shopMenu(){
        showView("viewShop");
        viewProducts();
    }

    function cartMenu(){
        showView("viewCart");
        viewCarts();
    }

    function logout(){
        $.ajax({
            method:"POST",
            url:kinveyBaseUrl+"user/"+kinveyAppId+"/_logout",
            headers:{"Authorization":"Kinvey "+sessionStorage.getItem("authToken")},
            body:JSON.stringify(""),
            success:successLogout,
            error:getError
        });

        function successLogout(index){
            sessionStorage.clear();
            showInfo("success logout")
            showView('viewAppHome');
            visionMenu();
        }
    }

    function registerUser(e){
        e.preventDefault();
        let body = JSON.stringify({
            "username":$("#registerUsername").val(),
            "password":$("#registerPasswd").val(),
            "name":$("#registerName").val()
        });
        $.ajax({
            method:"POST",
            url:kinveyBaseUrl+"user/"+kinveyAppId,
            headers:kinveyAutHeaders,
            contentType:"application/json",
            data:body,
            success:successRegister,
            error:getError
        });

        function successRegister(index){
            sessionStorage.setItem("userId",index._id);
            sessionStorage.setItem("username",index.username);
            sessionStorage.setItem("authToken",index._kmd.authtoken);
            showInfo("success register");
            visionMenu();
            $("#spanMenuLoggedInUser").text("Welcome,"+sessionStorage.getItem("username"));
            $("#viewUserHomeHeading").text("Welcome,"+sessionStorage.getItem("username"))
            showView("viewUserHome");
            $("#registerUsername").val("");
            $("#registerPasswd").val("");
        }
    }

    function loginUser(e) {
        e.preventDefault();
        let body = JSON.stringify({
            "username":$("#loginUsername").val(),
            "password":$("#loginPasswd").val()
        });
        //console.log(body);
        $.ajax({
            method:"POST",
            url:kinveyBaseUrl+"user/"+kinveyAppId+"/login",
            headers:kinveyAutHeaders,
            contentType:"application/json",
            data:body,
            success:successLogin,
            error:getError
        });

        function successLogin(index){
            showInfo("success login");
            sessionStorage.setItem("userId",index._id);
            sessionStorage.setItem("username",index.username);
            sessionStorage.setItem("authToken",index._kmd.authtoken);
            visionMenu();
            $("#spanMenuLoggedInUser").text("Welcome,"+sessionStorage.getItem("username")+"!");
            $("#viewUserHomeHeading").text("Welcome,"+sessionStorage.getItem("username")+"!")
            showView("viewUserHome");
            $("#loginUsername").val("");
            $("#loginPasswd").val("");
        }

    }

    function viewProducts(){

        $.ajax({
            method:"GET",
            url:kinveyBaseUrl+"appdata/"+kinveyAppId+"/products",
            headers:{"Authorization":"Kinvey "+sessionStorage.getItem("authToken")},
            success:getProducts,
            error:getError
        });
        function getProducts(products){
            $("#shopProducts tbody").empty();
            for(let product of products){
                let obj1={
                    name:product.name,
                    description:product.description,
                    price:product.price
                };
                let purchase =$("<a href='#'>Purchase</a>").click(function(){
                    purchased(product._id,obj1)
                });
                let prices = Number(product.price).toFixed(2);
                let tr = $("<tr>");
                tr.append($(`<td>${product.name}</td>`));
                tr.append($(`<td>${product.description}</td>`));
                tr.append($(`<td>${prices}</td>`));
                tr.append($("<td>").append(purchase));
                tr.appendTo($("#shopProducts tbody"))
            }


        }
    }

    function purchased(productId,products){
        //console.log(productId);
        //console.log(products);
        $.ajax({
            method:"GET",
            url:kinveyBaseUrl+"user/"+kinveyAppId+"/"+sessionStorage.getItem("userId"),
            headers:{"Authorization":"Kinvey "+sessionStorage.getItem("authToken")},
            success:getUserCards,
            error:getError
        });
        function getUserCards(datas){
            //console.log(datas)
            if(datas.cart==""||!datas.cart){
                datas.cart={};
                let newProduct ={product:products,quantity:1};
                datas.cart[productId]=newProduct;
            }else{
                let bool = true;
                for (let card in datas.cart){
                    //console.log(card);
                    if(productId==card) {
                        bool = false
                    }
                }
                if(bool==false){
                    let number = Number(datas.cart[productId].quantity);
                    number++;
                    JSON.stringify(number);
                    //console.log(number);
                    datas.cart[productId].quantity=number;
                }else{
                    let car = {product:products,quantity:1};
                    datas.cart[productId]=car;
                }
            }

            //console.log(datas)
            $.ajax({
                method:"PUT",
                url:kinveyBaseUrl+"user/"+kinveyAppId+"/"+sessionStorage.getItem("userId"),
                headers:{"Authorization":"Kinvey "+sessionStorage.getItem("authToken")},
                data:datas,
                success:successPut,
                error:getError
            });
            function successPut(index){
                //console.log(index)
                viewProducts();
            }
        }
    }

    function viewCarts(){
        $.ajax({
            method:"GET",
            url:kinveyBaseUrl+"user/"+kinveyAppId+"/"+sessionStorage.getItem("userId"),
            headers:{"Authorization":"Kinvey "+sessionStorage.getItem("authToken")},
            success:getCarts,
            error:getError
        });

        function getCarts(cards){
            //console.log(cards)
            $("#cartProducts tbody").empty();
            let obj = cards;
            let inventar = cards.cart;
            for(let card in inventar){
                let discard =$("<button type='button'>Discard</button>")
                    .click(function(){
                    discarded(card, obj)
                });
                let price = Number(cards.cart[card].product.price);
                let totalPrice = (price*(cards.cart[card].quantity)).toFixed(2);
                let tr = $("<tr>");
                tr.append($(`<td>${cards.cart[card].product.name}</td>`));
                tr.append($(`<td>${cards.cart[card].product.description}</td>`));
                tr.append($(`<td>${cards.cart[card].quantity}</td>`));
                tr.append($(`<td>${totalPrice}</td>`));
                tr.append($("<td>").append(discard));
                tr.appendTo($("#cartProducts tbody"))
            }
        }

    }

    function discarded(card, obj){

        for(let item in obj.cart){
            if(card==item){
               delete obj.cart[item];
            }
        }

        $.ajax({
            method:"PUT",
            url:kinveyBaseUrl+"user/"+kinveyAppId+"/"+sessionStorage.getItem("userId"),
            headers:{"Authorization":"Kinvey "+sessionStorage.getItem("authToken")},
            data:obj,
            success:updateList,
            error:getError
        });
        function updateList(data){
            showInfo("Product discarded!")
            viewCarts()
        }
    }


    function showInfo(message){
        $("#infoBox").text(message);
        $("#infoBox").show();
        setTimeout(function () {
            $("#infoBox").fadeOut()
        },2000)
    };

    function getError(response){
        let errorMsg = JSON.stringify(response);
        if(response.readyState===0){
            errorMsg = "Cannot connect due to network error.";
        }
        if(response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        Error(errorMsg);
    }

    function Error(errorMsg){
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
        $('#errorBox').click(function(){
            setTimeout(function(){
                $('#errorBox').fadeOut();
            },1000)

        })
    }

}