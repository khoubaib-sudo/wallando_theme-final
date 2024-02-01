var cpc_currentPrice = 0,
    miniMumCartValue = 0,
    priceMarkerDecimals = 0,
    baseVariantId = 0,
    cpc_newVariantId = 0,
    cpc_calculatorId = "",
    cpc_waitforcartconfirmation = !0,
    baseCalculatorApiUrl = "https://calcapi.printgrid.io",
    calculatorStyling = null,
    cpc_data = {},
    cpc_configData = {},
    spaceRegex = new RegExp(" ", "g"),
    specialCharactersRegex = /[^\w\s]/gi,
    cpc_shopUrl = "apippa",
    cpc_product_default_price = 0,
    cpc_pageLoaded = !1,
    cpc_isPreview = !1,
    cpc_productId = 0,
    cpc_metaFields = [],
    cpc_th_sep = 0,
    cpc_dec_sep = 0;
function DetectPage() {
    const e = window.location.pathname;
    switch (e.substring(e.lastIndexOf("/") + 1).toUpperCase()) {
        case "CART":
            ProcessCartPage();
            break;
        default:
            ProcessProductPage();
    }
}
async function LoadCalculator(e, a) {
    var t = baseCalculatorApiUrl + "/api/calculator/load?id=" + e + "&productId=" + cpc_productId + "&isPreview=" + a + "&shop=" + cpc_shopUrl;
    return await fetch(t);
}
async function ProcessProductPage() {
    var e, a, t;
    if (
        (jQuery('form[action*="/cart/add"]').each(function (t, r) {
            var o = jQuery(r).data("cpc-product-form");
            r.querySelector('[type="submit"]') && (void 0 === e || (void 0 !== o && 1 == o)) && ((e = null !== r ? r.querySelector('[type="submit"]') : null), (a = r)),
                r.querySelector('button[class*="cart"]') && (void 0 === e || (void 0 !== o && 1 == o)) && ((e = null !== r ? r.querySelector('button[class*="cart"]') : null), (a = r));
        }),
        (this.productForm = a),
        (this.submitButton = e),
        cpc_productId > 0)
    ) {
        var r = await fetchCalculatorByProduct();
        null != r && null != r.CalcUniqueIden && null != r.CalcUniqueIden && "" != r.CalcUniqueIden && (console.log("CalculatorId found from API"), (t = r.CalcUniqueIden));
    }
    if (null == t || 0 == t || null == t) {
        this.calculatorElement = document.getElementById("calculator-block");
        var o = document.getElementById("custom-calculator");
        null != (t = jQuery(o).attr("data-calculatorid")) && null != t && console.log("CalculatorId found from Fallback Method", t);
    }
    if (null != t && null != t) {
        (cpc_calculatorId = t), console.log("calculator found", t), console.log("product Id", cpc_productId), console.log("submit", this.submitButton), loadScripts(), await fetchProductMetaData();
        var n;
        ["product-price", "product-single__price", "selector-wrapper", "current_price", "product__price", "shopify-payment-button", "single-option-selector"].forEach((e) => {
            jQuery("." + e).addClass("hide-element");
        }),
            null !== (n = document.querySelector('select[name="id"]')) && ((baseVariantId = n.value), n.setAttribute("name", "oldId")),
            null !== (n = document.querySelector('input[name="id"]')) && ((baseVariantId = n.value), n.setAttribute("name", "oldId")),
            this.productForm.addEventListener("submit", function (e) {
                e.preventDefault(), e.stopImmediatePropagation(), e.stopPropagation();
            });
        var l = document.createElement("link");
        l.setAttribute("rel", "stylesheet"), l.setAttribute("type", "text/css"), l.setAttribute("href", baseCalculatorApiUrl + "/style?shop=" + cpc_shopUrl), document.getElementsByTagName("head")[0].appendChild(l);
        var i = this.submitButton;
        (elClone = i.cloneNode(!0)),
            i.parentNode.replaceChild(elClone, i),
            (this.submitButton = elClone),
            this.submitButton.addEventListener("click", await HandleAddToCartEvent),
            jQuery("#custom-calculator").hide(),
            LoadCalculator(t, cpc_isPreview)
                .then((e) => e.json())
                .then((e) => {
                    (cpc_data = e.CalculatorData),
                        (cpc_metaFields = e.MetaFields),
                        (cpc_configData = e.Configuration),
                        (cpc_th_sep = e.Configuration.ThousandSeperator),
                        (cpc_dec_sep = e.Configuration.DecimalSeperator),
                        (calculatorStyling = e.Styling),
                        (cpc_waitforcartconfirmation = e.WaitForCartConfirmation),
                        console.log("meta-fields", cpc_metaFields);
                    var a = buildCalculator(cpc_data),
                        r = document.querySelector(".add-to-cart");
                    null == r && (r = document.querySelector("form[action='/cart/add'] button[type=submit]")), null == r && (r = this.submitButton), (r = this.submitButton), console.log("render-block", r);
                    var o = "rounded" === calculatorStyling.Border ? "class='rounded-edges'" : "";
                    jQuery(r)
                        .parent()
                        .prepend("<div id='calculator' data-calcid='" + t + "' " + o + " style='background-color:" + calculatorStyling.UpperBackground + "'>" + a + "</div>");
                    var n = baseCalculatorApiUrl + "/api/customscripts/getCustomScript?shop=" + cpc_shopUrl;
                    if (null != n && n.length > 0) {
                        var l = document.createElement("script");
                        l.setAttribute("type", "text/javascript"), l.setAttribute("src", n), (l.defer = !0), l.setAttribute("crossorigin", "anonymous"), document.getElementsByTagName("head")[0].appendChild(l);
                    }
                    firstLoad(), PreventCheckoutOnEnter();
                });
    }
}
async function fetchCalculatorByProduct() {
    try {
        let e;
        return (
            await fetch(baseCalculatorApiUrl + "/api/calculator/getCalculatorByProductId?id=" + cpc_productId)
                .then((e) => e.json())
                .then(async function (a) {
                    void 0 !== a && (e = a);
                }),
            e
        );
    } catch (e) {}
}
async function HandleAddToCartEvent(e) {
    e.preventDefault(), e.stopImmediatePropagation(), e.stopPropagation(), jQuery(".loading-anim").hide();
    jQuery(".modal-pdp").removeClass('show-modal'); 
    jQuery("#main-content").addClass('custom-popup-active');
    var a = GetVariantProperties();
    !0 !== ValidateInputs()
        ? jQuery
              .ajax({
                  method: "POST",
                  url: baseCalculatorApiUrl + "/api/calculator/variant",
                  data: JSON.stringify({ calculatorId: cpc_calculatorId, productId: window.meta.product.id, properties: { ...a } }),
                  headers: { Accept: "application/json", "Content-Type": "application/json" },
              })
              .done(function (a) {
                  if (jQuery("#Quantity")) {
                      var t = e.value;
                      t && Number(t);
                  }
                  jQuery("#main-content").removeClass('custom-popup-active');
                  if ("object" == typeof a && null !== a) return showDialog(), void jQuery(".loading-anim").hide();
                  (document.getElementById("variantIdCustom").value = a), UpdateAllSelectedCheckBox(), UpdateAllHiddenElements(), SubmitFormData();
              })
        : jQuery("#main-content").removeClass('custom-popup-active'); //jQuery(".loading-anim").hide();
}
async function fetchProductMetaData() {
    try {
        if (!1 === cpc_isPreview) {
            let a = window.location.href.split("?")[0],
                t = window.location.href.split("?")[1];
            void 0 === t && (t = "");
            let r = t.startsWith("preview_key");
            var e = a + ".js?d=" + Math.random();
            !0 === r && (e = a + ".js?" + t + "&d=" + Math.random()),
                await fetch(e)
                    .then((e) => e.json())
                    .then(async function (e) {
                        if (void 0 !== e) {
                            var a = e.variants[0];
                            void 0 !== a && (cpc_product_default_price = a.price / 100);
                        }
                    }),
                console.log("shopify product price", cpc_product_default_price);
        } else console.log("Calculator in preview mode"), (cpc_product_default_price = 10);
    } catch (e) {
        globalHelper_ReportError(e, "Shopify Price Error:. ProductId =" + cpc_productId),
            (cpc_product_default_price = 0),
            setTimeout(function () {
                window.location.reload();
            }, 3e3);
    }
}
function ProcessCartPage() {
    (window.CPC_CartQuantityOnChange = CARTPAGE_adjustLineItems), CARTPAGE_adjustLineItems();
}
function CARTPAGE_adjustLineItems() {
    jQuery('input[class*="qty"]').on("change", function () {
        setTimeout(() => {
            console.log("quantity changed"), CARTPAGE_adjustLineItems();
        }, 1e3);
    });
    for (var e = 0, a = document.querySelectorAll("li,p,span,label").length; e < a; e++);
    fetch("/cart.js?cache=false&q=" + Math.random())
        .then((e) => e.json())
        .then(async function (e) {
            let a = e.items,
                t = e.total_price,
                r = (e.original_total_price, []);
            $isMissingPrice = !1;
            for (let e = 0; e < a.length; e++) 0 === a[e].price && ($isMissingPrice = !0), r.push(a[e]);
            var o = await CARTPAGE_LoadVariants(r);
            if (o.length > 0) {
                for (let a = 0; a < o.length; a++) {
                    let l = o[a],
                        i = 0;
                    jQuery.each(r, function (e, a) {
                        a.variant_id == l.ShopifyVariantId && (i = a.quantity);
                    }),
                        $isMissingPrice && (t += l.Amount * i * 100),
                        jQuery("cpc.product_title[data-id='" + l.ShopifyVariantId + "']").html(l.ShopifyProductTitle),
                        jQuery("cpc.original_price[data-id='" + l.ShopifyVariantId + "']").html(CARTPAGE_formatPrice(e.currency, l.Amount)),
                        jQuery("cpc.price[data-id='" + l.ShopifyVariantId + "']").html(CARTPAGE_formatPrice(e.currency, l.Amount)),
                        jQuery("cpc.discounted_price[data-id='" + l.ShopifyVariantId + "']").html(CARTPAGE_formatPrice(e.currency, l.Amount)),
                        jQuery("cpc.final_line_price[data-id='" + l.ShopifyVariantId + "']").html(CARTPAGE_formatPrice(e.currency, l.Amount * i)),
                        jQuery("cpc.line_price[data-id='" + l.ShopifyVariantId + "']").html(CARTPAGE_formatPrice(e.currency, l.Amount * i)),
                        jQuery("cpc.original_line_price[data-id='" + l.ShopifyVariantId + "']").html(CARTPAGE_formatPrice(e.currency, l.Amount * i));
                    var n = jQuery("img[data-cpcimageid='" + l.ShopifyVariantId + "']");
                    void 0 !== n && null !== l.ProductImageUrl && n.length > 0 && (n[0].setAttribute("src", l.ProductImageUrl), n[0].setAttribute("data-src", l.ProductImageUrl));
                }
                jQuery("cpc.final_price").html(CARTPAGE_formatPrice(e.currency, t / 100, !0)), jQuery("cpc.cart_total_price").html(CARTPAGE_formatPrice(e.currency, t / 100, !0));
            }
        });
}
function CARTPAGE_formatPrice(e, a, t) {
    let r = Number(a).toFixed(2),
        o = CARTPAGE_getCurrency(e, t),
        n = formatMoney(a, getCurrencyFormat(e).money_format);
    return console.log(n), o.before + r + " " + o.after;
}
function CARTPAGE_getCurrency(e, a = !1) {
    var t = e.toUpperCase();
    switch (t) {
        case "USD":
            return { before: "$", after: a ? t : "" };
        case "CAD":
            return { before: "$", after: a ? t : "CAD" };
        case "DKK":
            return { before: "", after: a ? t : "KR" };
        case "GBP":
            return { before: "&pound;", after: a ? t : "" };
        case "AUD":
            return { before: "$", after: a ? t : "AUD" };
        case "BRL":
            return { before: "R$", after: a ? t : "" };
        case "ZAR":
            return { before: "R", after: a ? t : "" };
        case "SGD":
        case "SGD":
            return { before: "$", after: a ? t : "" };
        case "EUR":
            return { before: "&euro;", after: a ? t : "" };
        case "MAD":
            return { before: "", after: "dh" };
        case "OMR":
            return { before: "", after: t };
        case "TRY":
            return { before: "", after: a ? t : "&#8378;" };
        case "CLP":
            return { before: "$", after: "" };
        case "IDR":
            return { before: "RP", after: "" };
        case "TRY":
            return { before: "", after: "TL" };
        case "MXN":
            return { before: "$", after: "" };
        default:
            return { before: "", after: e.toUpperCase() };
    }
}
async function CARTPAGE_LoadVariants(e) {
    let a = null;
    return (
        (n = new Request(baseCalculatorApiUrl + "/api/calculator/loadVariants", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ shop: cpc_shopUrl, variants: e }) })),
        await fetch(n)
            .then((e) => e.json())
            .then(async (e) => {
                a = e;
            }),
        a
    );
}
function SubmitFormData() {
    jQuery(".loading-anim").hide(), console.log("posting product data...");
   
    jQuery(".modal-pdp").removeClass('show-modal');
    jQuery("#main-content").addClass('custom-popup-active');

    var e = this.productForm;
    let a = 1;
    console.log(e),
        [...e.elements].forEach((t) => {
            if (!0 === jQuery(t).data("cpc_isquantity")) {
                let r = jQuery(t).attr("name");
                (a = e.elements[r].value), jQuery(t).remove();
            }
        });
    var t = new FormData(e);
    t.append("quantity", a),
        jQuery.ajax({
            type: "POST",
            url: "/cart/add",
            data: t,
            xhr: function () {
                var e = new window.XMLHttpRequest();
                if (null !== calculatorStyling && null !== calculatorStyling.FileUploadProgressText && "" !== calculatorStyling.FileUploadProgressText) {
                    let a = 1;
                    e.upload.addEventListener(
                        "progress",
                        function (e) {
                            if ((a++, e.lengthComputable && a > 2)) {
                                var t = (e.loaded / e.total) * 100;
                                console.log("percentComplete", t), (t = t.toFixed(2)), jQuery("#cpc_loader_text").html(calculatorStyling.FileUploadProgressText + " " + t + " %");
                            }
                        },
                        !1
                    );
                }
                return e;
            },
            processData: !1,
            contentType: !1,
            success: function () {
                null !== calculatorStyling && "" !== calculatorStyling.LoaderText && jQuery("#cpc_loader_text").html(calculatorStyling.LoaderText), IsShopifyCartReady();
                const cartOpen = new CustomEvent("cart:open");
                document.dispatchEvent(cartOpen);
            },
            error: function (e) {
                console.log("add to cart request errored", e), null !== calculatorStyling && "" !== calculatorStyling.LoaderText && jQuery("#cpc_loader_text").html(calculatorStyling.LoaderText), IsShopifyCartReady();
            },
        });
}
function IsShopifyCartReady(e = 0) {
    jQuery("#main-content").removeClass('custom-popup-active');
    const cartBuild = new CustomEvent("cart:build");
    document.dispatchEvent(cartBuild);
    
    var a = !1,
        t = null;
    [].forEach((e) => {
        !1 === a && jQuery("." + e)[0] && ((t = e), (a = !0));
    }),
        !1 === cpc_waitforcartconfirmation
            ? !0 === a
                ? (jQuery("." + t).trigger("click"), jQuery("#main-content").removeClass('custom-popup-active'))
                : document.dispatchEvent(cartBuild)
            : fetch("/cart.js?cache=false&q=" + Math.random())
                  .then((e) => e.json())
                  .then(function (r) {
                      -1 === JSON.stringify(r).search('price":0')
                          ? (!0 === a ? (jQuery("." + t).trigger("click"), jQuery("#main-content").removeClass('custom-popup-active')) : document.dispatchEvent(cartBuild), !1 === a &&  document.dispatchEvent(cartBuild))
                          : (e++,
                            setTimeout(() => {
                                console.log("waiting for cart confirmation"), IsShopifyCartReady(e);
                            }, 1e3));
                  })
                  .catch(function (e) {
                      return console.log(e), !1;
                  });
}
function GetVariantProperties() {
    var e = [],
        a = {};
    for (var t in (jQuery(".calc-prop").each(function (t, r) {
        let o = jQuery(r).is(":hidden"),
            n = void 0 !== jQuery(r).data("lookup"),
            l = !!n && !0 === jQuery(r).data("isformula");
        if ("number" == (m = jQuery(r).prop("type"))) {
            var i = CheckNumberInputValidity(r);
            if (void 0 !== i && !i) return (isError = !0), void jQuery(r).addClass("error-border");
        }
        if (!1 === o || !0 === l) {
            var c = jQuery(r).attr("name"),
                u = jQuery(r).val();
            let t = jQuery(r).is(":checkbox");
            var m = jQuery(r).prop("nodeName");
            if (!0 === jQuery(r).is(":radio")) {
                if (!1 === jQuery(r).is(":checked")) return !0;
                u = jQuery(r).data("val");
            } else if ("LABEL" === m) u = jQuery(r).data("val");
            else if (!0 === t) {
                let e = jQuery(r).is(":checked"),
                    a = jQuery(r).data("checkedvalue"),
                    t = jQuery(r).data("uncheckedvalue");
                u = e ? a : t;
            }
            if (("length" === (c = (c = c.replace("properties[", "")).replace("]", "")) && (c = "Length"), !0 === n)) {
                let e = jQuery(r).data("lookupelementindex"),
                    t = jQuery(r).data("identifier");
                if (void 0 === a[t]) {
                    var s = { elementName: t, input1: 0, input2: 0 };
                    1 === e ? (s.input1 = parseFloat(jQuery(r).val())) : 2 === e && (s.input2 = parseFloat(jQuery(r).val())), (a[t] = s);
                } else {
                    let o = a[t];
                    1 === e ? (o.input1 = parseFloat(jQuery(r).val())) : 2 === e && (o.input2 = parseFloat(jQuery(r).val()));
                }
            } else e[c] = u;
        }
    }),
    a))
        e[t] = a[t];
    return (
        (e.shopify_product_price = cpc_product_default_price),
        cpc_metaFields.forEach((a) => {
            e["shopify_meta_" + a.key] = a.value;
        }),
        e
    );
}
function buildCalculator(e) {
    var a = "";
    return (
        e.Elements.forEach(function (e, t) {
            switch (e.ElementType) {
                case "TextInput":
                case "NumberInputNew":
                    var r = buildNumberInput(e);
                    a += r;
                    break;
                case "SelectList":
                    var o = buildDropDown(e);
                    a += o;
                    break;
                case "ImageSelector":
                    o = buildImageSelector(e);
                    a += o;
                    break;
                case "TextEditor":
                    r = buildTextDisplayBlock(e);
                    a += r;
                    break;
                case "ImageUpload":
                    var n = buildImageElement(e);
                    a += n;
                    break;
                case "LongTextInput":
                    var l = buildTextInput(e);
                    a += l;
                    break;
                case "Checkbox":
                    l = buildCheckboxInput(e);
                    a += l;
                    break;
                case "Radio":
                    var i = buildRadioElement(e);
                    a += i;
                    break;
                case "Calculation":
                    r = buildCalculationElement(e);
                    a += r;
                    break;
                case "Lookup":
                    r = buildLookupInput(e);
                    a += r;
                    break;
                case "PriceMarker":
                    r = buildPriceMarker(e);
                    a += r;
            }
        }),
        (a += buildVariantElement())
    );
}
function buildNumberInput(e) {
    var a = null != e.MinValue ? e.MinValue : 0,
        t = null != e.Maxvalue ? e.Maxvalue : 1e5;
    let r = null != e.Maxdecimals ? e.Maxdecimals : 0,
        o = null != e.enableToolTip && e.enableToolTip,
        n = o ? e.toolTip : null,
        l = null != e.isQuantity && e.isQuantity;
    var i = null != e.Maxdecimals ? generateStep(e.Maxdecimals) : 1,
        c = getConditionalDisplay(e),
        u = e.Name.replace(/"/g, "&quot;");
    let m = !0 === o ? "<span class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + n + "<i></i></span></span>" : "";
    return (
        "<div class='element' data-element='" +
        e.Identifier +
        "' " +
        c.conditionalTemplate +
        "><label style='color:" +
        calculatorStyling.UpperTextColor +
        "'>" +
        e.Name +
        m +
        "</label><input onkeyup='PriceUpdation(this);' onchange='PriceUpdation(this);' data-identifier='" +
        e.Identifier +
        "' class='calc-prop numInput-cpc' step='" +
        i +
        "' min='" +
        a +
        "' max='" +
        t +
        "' onblur='CheckNumberInputValidity(this," +
        r +
        ");' data-rangeenabled='" +
        e.value_range_enabled +
        "' data-calcname='" +
        e.Name +
        "' name=\"properties[" +
        u +
        "]\" data-cpc_isquantity='" +
        l +
        "' value='" +
        e.DefaultValue +
        "' type='number'/></div>"
    );
}
function buildLookupInput(e) {
    var a = null != e.input1_minvalue ? e.input1_minvalue : 0,
        t = null != e.input1_maxvalue ? e.input1_maxvalue : 1e5;
    let r = null != e.input1_maxdecimals.Maxdecimals ? e.input1_maxdecimals.Maxdecimals : 0;
    t = Math.round(t, r);
    var o = null != e.input1_maxdecimals ? generateStep(e.input1_maxdecimals) : 1,
        n = null != e.input1_isformula && e.input1_isformula,
        l = null != e.input2_minvalue ? e.input2_minvalue : 0,
        i = null != e.input1_maxvalue ? e.input2_maxvalue : 1e5;
    let c = null != e.input2_maxdecimals.Maxdecimals ? e.input2_maxdecimals.Maxdecimals : 0;
    i = Math.round(i, c);
    var u = null != e.input2_maxdecimals ? generateStep(e.input2_maxdecimals) : 1,
        m = null != e.input2_isformula && e.input2_isformula,
        s = getConditionalDisplay(e),
        d = "",
        _ = n ? "hide-element" : "",
        p = m ? "hide-element" : "";
    let f = n ? "lookup-element-with-formula" : "",
        y = m ? "lookup-element-with-formula" : "",
        h = null != e.enableToolTip && e.enableToolTip,
        g = h ? e.toolTip : null,
        v = !0 === h ? "<span class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + g + "<i></i></span></span>" : "";
    return (
        (d +=
            "<div class='element " +
            _ +
            "' data-element='" +
            e.Identifier +
            "_1' " +
            s.conditionalTemplate +
            "><label style='color:" +
            calculatorStyling.UpperTextColor +
            "'>" +
            e.input1_label +
            v +
            "</label><input onfocusout='onChange(null)' data-lookup='true' data-lookupelementindex='1' data-identifier='" +
            e.Identifier +
            "' class='calc-prop " +
            f +
            "' step='" +
            o +
            "' data-minvalue='" +
            a +
            "' min='" +
            a +
            "' max='" +
            t +
            "' onblur='validity.valid || (value = \"\");' data-calcname='" +
            e.input1_label +
            "' data-isformula='" +
            n +
            "' data-formula='" +
            e.input1_formula +
            "' name=\"properties[" +
            e.input1_label +
            "]\" value='" +
            e.input1_minvalue +
            "' type='number'/></div>"),
        (d +=
            "<div class='element " +
            p +
            "' data-element='" +
            e.Identifier +
            "_2' " +
            s.conditionalTemplate +
            "><label style='color:" +
            calculatorStyling.UpperTextColor +
            "'>" +
            e.input2_label +
            v +
            "</label><input onfocusout='onChange(null)' data-lookup='true' data-lookupelementindex='2' data-identifier='" +
            e.Identifier +
            "' class='calc-prop " +
            y +
            "' step='" +
            u +
            "' data-minvalue='" +
            l +
            "' min='" +
            l +
            "' max='" +
            i +
            "' onblur='validity.valid || (value = \"\");' data-calcname='" +
            e.input2_label +
            "' data-isformula='" +
            m +
            "' data-formula='" +
            e.input2_formula +
            "' name=\"properties[" +
            e.input2_label +
            "]\" value='" +
            e.input2_minvalue +
            "' type='number'/></div>")
    );
}
function buildTextDisplayBlock(e) {
    var a = null != e.TextValue ? e.TextValue : "",
        t = getConditionalDisplay(e);
    let r = null != e.enableToolTip && e.enableToolTip,
        o = r ? e.toolTip : null,
        n = !0 === r ? "<span class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + o + "<i></i></span></span>" : "";
    return "<div class='element' data-element='" + e.Identifier + "' " + t.conditionalTemplate + " ><label style='color:" + calculatorStyling.UpperTextColor + "'>" + a + n + "</label></div>";
}
function buildImageElement(e) {
    var a = e.isRequired,
        t = getConditionalDisplay(e);
    let r = null != e.enableToolTip && e.enableToolTip,
        o = r ? e.toolTip : null,
        n = !0 === r ? "<span class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + o + "<i></i></span></span>" : "";
    return (
        "<div class='element' data-element='" +
        e.Identifier +
        "' " +
        t.conditionalTemplate +
        "><label style='color:" +
        calculatorStyling.UpperTextColor +
        "'>" +
        e.Name +
        n +
        "</label><input id='fileinput' class='calc-prop' data-identifier='" +
        e.Identifier +
        "' data-isrequired='" +
        a +
        "' type='file' name=\"properties[" +
        e.Name +
        ']" /></div>'
    );
}
function buildTextInput(e) {
    var a = null != e.MinCharacters ? e.MinCharacters : 0,
        t = null != e.MaxCharacters ? e.MaxCharacters : 1e5,
        r = e.isRequired,
        o = getConditionalDisplay(e);
    let n = null != e.enableToolTip && e.enableToolTip,
        l = n ? e.toolTip : null,
        i = !0 === n ? "<span class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + l + "<i></i></span></span>" : "";
    return (
        "<div class='element' data-element='" +
        e.Identifier +
        "' " +
        o.conditionalTemplate +
        "><label style='color:" +
        calculatorStyling.UpperTextColor +
        "'>" +
        e.Name +
        i +
        "</label><textarea class='calc-prop' data-identifier='" +
        e.Identifier +
        "' data-isrequired='" +
        r +
        "' minlength='" +
        a +
        "' maxlength='" +
        t +
        "' onblur='UpdatePrice() || validity.valid || (value = \"\");' data-calcname='" +
        e.Name +
        "' name=\"properties[" +
        e.Name +
        "]\" placeholder='" +
        e.Placeholder +
        "' data-lengthToggle='" +
        e.lengthToggle +
        "'></textarea></div>"
    );
}
function buildCheckboxInput(e) {
    var a = e.checkedValue,
        t = e.uncheckedValue,
        r = e.isRequired,
        o = getConditionalDisplay(e);
    let n = null != e.enableToolTip && e.enableToolTip,
        l = n ? e.toolTip : null,
        i = !0 === n ? "<div class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + l + "<i></i></span></div>" : "";
    return (
        "<div class='element checkbox-element' data-element='" +
        e.Identifier +
        "' data-isrequired='" +
        r +
        "' " +
        o.conditionalTemplate +
        "'><input class='calc-prop checkbox' data-identifier='" +
        e.Identifier +
        "' data-isrequired='" +
        r +
        "'' onchange='onChange(null)' type='checkbox' value='" +
        a +
        "' name=\"properties[" +
        e.Name +
        "]\" data-calcname='" +
        e.Name +
        "' data-checkedvalue='" +
        a +
        "' data-uncheckedvalue='" +
        t +
        "'/><span style='color:" +
        calculatorStyling.UpperTextColor +
        "'>" +
        e.Name +
        i +
        "</span></div>"
    );
}
function buildRadioElement(e) {
    var a = getConditionalDisplay(e),
        t = e.Name.replace(/"/g, "&quot;");
    let r = null != e.enableToolTip && e.enableToolTip,
        o = r ? e.toolTip : null,
        n = !0 === r ? "<div class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + o + "<i></i></span></div>" : "";
    var l = "<div class='element checkbox-element' data-element='" + e.Identifier + "' " + a.conditionalTemplate + "'> " + e.Identifier + n + "<br/>";
    let i = 0;
    return (
        e.Options.forEach((a) => {
            let r = 0 === i ? "checked" : "";
            (l +=
                "<input class='calc-prop radio' data-identifier='" +
                e.Identifier +
                "' type='radio' onchange='onChange(null)' data-val='" +
                a.value +
                "' value='" +
                a.label +
                "' name=\"properties[" +
                t +
                ']" ' +
                r +
                " data-calcname='" +
                e.Name +
                "'/><span style='color:" +
                calculatorStyling.UpperTextColor +
                "'>" +
                a.label +
                "</span>"),
                i++;
        }),
        (l += "</div>")
    );
}
function buildVariantElement() {
    return "<input id='variantIdCustom' name='id' type='hidden' value='0' />";
}
function buildDropDown(e) {
    var a = getConditionalDisplay(e),
        t = e.Name.replace(/"/g, "&quot;");
    let r = null != e.enableToolTip && e.enableToolTip,
        o = r ? e.toolTip : null,
        n = !0 === r ? "<div class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + o + "<i></i></span></div>" : "";
    var l =
        "<div class='element' data-element='" +
        e.Identifier +
        "' " +
        a.conditionalTemplate +
        "><label style='color:" +
        calculatorStyling.UpperTextColor +
        "'>" +
        e.Name +
        n +
        "</label><select style='border:1px solid yellow' data-identifier='" +
        e.Identifier +
        "' onchange='onChange(null, this)' class='calc-prop' data-calcname='" +
        t +
        "' name=\"properties[" +
        t +
        ']">';
    return (
        e.Options.forEach((e) => {
            l += "<option data-val='" + e.value + "'>" + e.label + "</option>";
        }),
        (l += "</select ></div >")
    );
}
function buildImageSelector(e) {
    var a = getConditionalDisplay(e),
        t = e.enableSwatch;
    let r = null != e.enableToolTip && e.enableToolTip,
        o = r ? e.toolTip : null,
        n = !0 === r ? "<div class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + o + "<i></i></span></div>" : "";
    var l = "";
    if (!1 === t)
        (l =
            "<div class='element' " +
            a.conditionalTemplate +
            "><label style='color:" +
            calculatorStyling.UpperTextColor +
            "'>" +
            e.Name +
            n +
            "</label><select style='border:1px solid yellow' data-showimage='" +
            e.showImage +
            "' data-identifier='" +
            e.Identifier +
            "' onchange='onChange(\"" +
            e.ElementType +
            "\", this)' class='calc-prop' data-calcname='" +
            e.Name +
            "' name=\"properties[" +
            e.Name +
            '">'),
            e.Options.forEach((e) => {
                l += "<option data-val='" + e.value + "' data-imgsrc='" + e.filepath + "'  >" + e.label + "</option>";
            }),
            (l += "</select ></div>"),
            e.Options.forEach((e) => {
                l += "<img src='" + e.filepath + "' style='display:none' />";
            });
    else {
        l =
            "<div class='element' " +
            a.conditionalTemplate +
            "><label class='element-label' data-identifier='" +
            e.Identifier +
            "' style='color:" +
            calculatorStyling.UpperTextColor +
            "'>" +
            e.Name +
            n +
            "</label><fieldset class='swatch-picker'>";
        let t = 0;
        e.Options.forEach((a) => {
            let r = 1 === ++t ? "checked" : "";
            l +=
                "<labele class='swatch-label ctooltip' title='" +
                a.label +
                "'><input type='radio' class='calc-prop' data-identifier='" +
                e.Identifier +
                "' " +
                r +
                " data-showimage='" +
                e.showImage +
                "' value='" +
                a.label +
                "' data-val='" +
                a.value +
                "' data-imgsrc='" +
                a.filepath +
                "' data-calcname='" +
                e.Name +
                "' name=\"properties[" +
                e.Name +
                ']" onchange=\'onChange("' +
                e.ElementType +
                "\", this)' /><img src='" +
                a.filepath +
                "' /></labele>";
        }),
            (l += "</fieldset></div>");
    }
    return l;
}
function getConditionalDisplay(e) {
    var a = !1 === (!0 !== e.conditional_display) ? "style='display:none;'" : "",
        t = e.conditional_display_selected_element,
        r = e.conditional_display_selected_element_value;
    return { displayStyle: a, conditionalElement: t, conditionalElementValue: r, conditionalTemplate: a + " data-conditionalelement='" + t + "' data-conditionalelementvalue='" + r + "'" };
}
function buildCalculationElement(e) {
    let a = parseFloat(e.formula_minvalue);
    a = Number(a).toFixed(e.formula_decimals);
    var t = getConditionalDisplay(e);
    let r = null != e.isQuantity && e.isQuantity;
    var o = e.Name.replace(spaceRegex, "_");
    o = o.replace(specialCharactersRegex, "");
    let n = null != e.enableToolTip && e.enableToolTip,
        l = n ? e.toolTip : null,
        i = !0 === n ? "<div class='c-tooltip'><i class='fas fa-info-circle'></i><span class='right'>" + l + "<i></i></span></div>" : "";
    return (
        "<div class='element' data-element='" +
        e.Identifier +
        "' " +
        t.conditionalTemplate +
        "><label style='color:" +
        calculatorStyling.UpperTextColor +
        "'>" +
        e.Name +
        i +
        "</label><span class='formula-block'> " +
        e.formula_prefix +
        " <label class='calculation-element calc-prop' name=\"properties[" +
        e.Name +
        "]\" data-minvalue='" +
        e.formula_minvalue +
        "' data-element_name='" +
        e.Name +
        "' data-val='" +
        e.formula_minvalue +
        "' data-decimals='" +
        e.formula_decimals +
        "' data-formula='" +
        e.formula +
        "' data-cpc_isquantity='" +
        r +
        "' id='formula_" +
        e.Name +
        "'>" +
        a +
        "</label><suffix>" +
        e.formula_suffix +
        "</suffix></span></div><input type='hidden' id='calculation_inp_" +
        o +
        "' name=\"properties[" +
        e.Name +
        "]\" data-cpc_isquantity='" +
        r +
        "' value='" +
        e.formula_minvalue +
        "' />"
    );
}
function buildPriceMarker(e) {
    (cpc_currentPrice = e.DefaultValue), (priceMarkerDecimals = e.Decimals), (miniMumCartValue = parseFloat(e.DefaultValue)), (miniMumCartValue = Number(miniMumCartValue).toFixed(e.Decimals));
    var a = "rounded" === calculatorStyling.Border ? "rounded-edges-bottom" : "",
        t = buildErrorBlock(),
        r = buildDialogBlock();
    return (
        null === calculatorStyling.LoaderText && (calculatorStyling.LoaderText = ""),
        t +
            r +
            ("<div class='loading-anim' style='display:none'><img src='https://calcapi.printgrid.io/file/loading-spinner.gif'><p id='cpc_loader_text'>" + calculatorStyling.LoaderText + "</p></div>") +
            "<div class='price-marker " +
            a +
            "' style='background-color:" +
            calculatorStyling.PriceBackground +
            ";color:" +
            calculatorStyling.PriceTextColor +
            "'><label style='color:" +
            calculatorStyling.PriceTextColor +
            "'>" +
            e.Name +
            "</label><span id='calculator-final-value'> " +
            e.Prefix +
            " <label id='priceTicker' style='color:" +
            calculatorStyling.PriceTextColor +
            "'>" +
            miniMumCartValue +
            "</label><suffix>" +
            e.Suffix +
            "</suffix></span></div>"
    );
}
function CheckNumberInputValidity(e, a) {
    let t = cpc_configData.AlertMessageNumberInput,
        r = 0,
        o = "",
        n = !0;
    var l = (e.value.split(".")[1] || "").length;
    if (!e.validity.valid) for (var i in e.validity) e.validity[i] && (r++, (o = i.toLowerCase()));
    if (
        ((r > 1 || (1 == e.step && "stepmismatch" == o) || l > a || (1 == r && 1 == r && "stepmismatch" != o && (null == $(e).data("lookup") || (null == $(e).data("lookup") && 1 != $(e).data("lookup"))))) && (n = !1),
        0 == e.value.length || !n)
    ) {
        if ((e.setAttribute("style", "border:1px solid red !important;"), (e.value = e.min || 0), null == e.nextSibling))
            if (t.replace("{input_range_min}", "").replace("{input_range_max}", "").trim().length > 0) {
                let a = e.getAttribute("min"),
                    r = e.getAttribute("max");
                (t = t.replace("{input_range_min}", a).replace("{input_range_max}", r).trim()), e.insertAdjacentHTML("afterend", "<label style='color:red;'>" + t + "</label>");
            } else e.insertAdjacentHTML("afterend", "<label style='color:red;'>Value out of range</label>");
        return UpdatePrice(), !1;
    }
    return e.style.setProperty("border", ""), null != e.nextSibling && e.nextSibling.remove(), UpdatePrice(), !0;
}
function PreventCheckoutOnEnter() {
    $("#calculator").on("keypress", function (e) {
        if ((console.log("checking for enter whether preseed for form."), 13 === (e.keyCode || e.which))) return console.log("Found Enter pressed for form."), e.preventDefault(), !1;
    });
}
function firstLoad() {
    let e;
    jQuery('form[action*="/cart/add"]').each(function (a, t) {
        void 0 === e && t.querySelector('[type="submit"]') && (e = t), void 0 === e && t.querySelector('button[class*="cart"]') && (e = t);
    });
    var a = e.querySelector("input[type='radio']:checked"),
        t = e.querySelector("select[data-showimage='true']");
    null != a ? imageddlChange(a) : null != t && imageddlChange(t), ProcessConditionalElements(), UpdatePrice(), PreventCheckoutOnEnter();
}
function onChange(e, a = null) {
    "ImageSelector" === e && imageddlChange(a), ProcessConditionalElements(), UpdatePrice();
}
function imageddlChange(e) {
    let a = jQuery(e).is(":radio");
    var t = jQuery(e).data("showimage");
    if (!0 === a) {
        if (!0 === t) {
            UpdateProductImage(jQuery(e).data("imgsrc"));
        }
    } else if (!0 === t) {
        UpdateProductImage(jQuery(e).children("option:selected").data("imgsrc"));
    }
}
function UpdateProductImage(e) {
    var a = document.querySelectorAll("[class^=product]>img");
    let t = !1,
        r = !1;
    a.forEach((a) => {
        if (!1 === jQuery(a).is(":hidden"))
            if (!1 === t) {
                var o = a.getAttribute("calcset"),
                    n = a.getAttribute("data-index"),
                    l = null === n || "1" === n,
                    i = window.location.host + "/cdn";
                (a.src.includes("cdn.shopify.com") || a.srcset.includes("cdn.shopify.com") || a.src.includes("myshopify.com") || a.srcset.includes("myshopify.com") || a.src.includes(i) || a.srcset.includes(i) || "true" === o) &&
                    !0 === l &&
                    ((t = !0), a.setAttribute("src", e), a.setAttribute("calcset", !0), a.setAttribute("data-srcset", ""), a.setAttribute("data-zoom", e), a.setAttribute("srcset", ""));
            } else if (!0 === t && !1 === r) {
                var c = document.querySelector('img[role="presentation"]');
                null != c && ((r = !0), c.setAttribute("src", e), c.setAttribute("calcset", !0), c.setAttribute("data-zoom", e), c.setAttribute("data-srcset", ""), c.setAttribute("srcset", ""));
            }
    });
}
function ProcessConditionalElements() {
    jQuery(".element").each((e, a) => {
        let t = jQuery(a).data("conditionalelement"),
            r = jQuery(a).data("conditionalelementvalue");
        if (null != t) {
            var o = globalHelper_Escape(t);
            let e = document.querySelector('select[data-identifier="' + o + '"]'),
                n = document.querySelector('input[type="radio"][data-identifier="' + o + '"]:checked'),
                l = document.querySelector('input[type="checkbox"][data-identifier="' + o + '"]'),
                i = null,
                c = !1;
            null !== e
                ? ((i = jQuery(e).val()), (c = jQuery(e).is(":hidden")))
                : null !== n
                ? ((i = jQuery(n).val()), (c = jQuery(n).is(":hidden")))
                : null !== l && ((i = !0 === jQuery(l).is(":checked") ? "Checked" : "Unchecked"), (c = jQuery(l).is(":hidden"))),
                null !== i && (i == r && !1 === c ? (jQuery(a).show(), jQuery(a).find(".calc-prop").show()) : (jQuery(a).hide(), jQuery(a).find(".calc-prop").hide()));
        }
    });
}
function UpdatePrice() {
    var formulaBeforeEval = "";
    try {
        var formula = cpc_data.Formula;
        EvaluateFormulaElements(), (formula = FormulaParser(formula)), "NaN" === formula && (formula = miniMumCartValue), (formulaBeforeEval = formula);
        var evaluatedNewPrice = eval(formula),
            finalValue = Math.max(miniMumCartValue, evaluatedNewPrice);
        finalValue == cpc_currentPrice ||
            isNaN(finalValue) ||
            (jQuery("#priceTicker")
                .prop("Counter", cpc_currentPrice)
                .animate(
                    { Counter: finalValue },
                    {
                        duration: 200,
                        easing: "swing",
                        step: function (e) {
                            jQuery(this).html(formatPricing(Number(e), +cpc_th_sep, +cpc_dec_sep));
                        },
                    }
                ),
            (cpc_currentPrice = finalValue)),
            EvaluateCalculationElements();
    } catch (e) {
        var msg = "FormulaBeforeEval = " + formulaBeforeEval;
        globalHelper_ReportError(e, msg);
    }
}
function EvaluateFormulaElements() {
    jQuery(".lookup-element-with-formula").each((d, elem) => {
        let elem_formula = jQuery(elem).data("formula"),
            elem_formula_minvalue = jQuery(elem).data("minvalue"),
            parsedFormula = FormulaParser(elem_formula.toString()),
            evaluatedValue = eval(parsedFormula),
            elem_finalValue = Math.max(elem_formula_minvalue, evaluatedValue);
        elem.setAttribute("value", elem_finalValue);
    });
}
function EvaluateCalculationElements() {
    jQuery(".calculation-element").each((d, elem) => {
        let elem_formula = jQuery(elem).data("formula"),
            elem_formula_minvalue = jQuery(elem).data("minvalue"),
            elem_current_value = jQuery(elem).data("val"),
            elem_decimals = jQuery(elem).data("decimals"),
            element_name = jQuery(elem).data("element_name"),
            parsedFormula = FormulaParser(elem_formula.toString()),
            evaluatedValue = eval(parsedFormula),
            elem_finalValue = Math.max(elem_formula_minvalue, evaluatedValue);
        elem_finalValue == elem_current_value ||
            isNaN(elem_finalValue) ||
            (jQuery(elem)
                .prop("Counter", elem_current_value)
                .animate(
                    { Counter: elem_finalValue },
                    {
                        duration: 200,
                        easing: "swing",
                        step: function (e) {
                            jQuery(elem).html(Number(e).toFixed(elem_decimals));
                        },
                    }
                ),
            jQuery(elem).data("val", elem_finalValue),
            (element_name = element_name.replace(spaceRegex, "_")),
            (element_name = element_name.replace(specialCharactersRegex, "")),
            jQuery("#calculation_inp_" + element_name).val(Number(elem_finalValue).toFixed(elem_decimals)),
            (elem_current_value = elem_finalValue));
    });
}
function FormulaParser(e) {
    try {
        e = e.toLowerCase();
        var a = new RegExp("math.", "g");
        (e = (e = e ? e.toString().replaceAll(a, "Math.") : "") ? e.toString().replaceAll("shopify_product_price", cpc_product_default_price) : ""),
            cpc_metaFields.forEach((a) => {
                e = e ? e.toString().replaceAll("shopify_meta_" + a.key, a.value) : "";
            });
        var t = new RegExp("shopify_meta_(.*?)([*/+-]|$)", "g");
        do {
            if (((m = t.exec(e)), m && m.length > 1)) {
                var r = m[1];
                (e = e ? e.toString().replaceAll("shopify_meta_" + r, 1) : ""), console.log("meta_variable_name", r);
            }
        } while (m);
        var o = jQuery(jQuery(".calc-prop").get());
        o = (o = jQuery(jQuery(".calc-prop").get())).sort((e, a) =>
            void 0 === jQuery(e).data("identifier") ? 1 : void 0 === jQuery(a).data("identifier") ? -1 : jQuery(e).data("identifier").length > jQuery(a).data("identifier").length ? -1 : 1
        );
        var n = {};
        for (var l in (o.each((a, t) => {
            let r = jQuery(t).is(":hidden"),
                o = jQuery(t).is(":checkbox"),
                l = jQuery(t).is(":radio");
            var i = jQuery(t).prop("nodeName");
            let c = jQuery(t).data("calcname"),
                u = jQuery(t).data("rangeenabled"),
                m = jQuery(t).data("lengthtoggle"),
                s = void 0 !== jQuery(t).data("lookup"),
                d = !!s && !0 === jQuery(t).data("isformula");
            if (void 0 !== c && void 0 !== c) {
                var _ = generateSafeRegex(c);
                if (!1 === r || (!0 === d && "none" != jQuery(t).css("display"))) {
                    if ("SELECT" == i) {
                        let a = jQuery(t).children("option:selected").data("val");
                        e = e.replace(_, a);
                    } else if ("INPUT" == i && !0 === u) {
                        let a = jQuery(t).val();
                        a = parseFloat(a);
                        var p = cpc_data.Elements;
                        let r = a;
                        p.forEach((e) => {
                            e.Identifier === c &&
                                e.options.forEach((e) => {
                                    a >= parseFloat(e.start) && a <= parseFloat(e.end) && (r = parseFloat(e.value));
                                });
                        });
                        var f = generateSafeRegex(c + "[ActualValue]");
                        (e = e.replace(f, a)), (r = parseFloat(r, 10)), (e = e.replace(_, r));
                    }
                    if ("TEXTAREA" == i) {
                        let a = jQuery(t).val();
                        m || (a = a.replace(/\s/g, ""));
                        let r = a.length;
                        var y = generateSafeRegex(c + "[length]");
                        e = e.replace(y, r);
                    } else if (!0 === o) {
                        let a = jQuery(t).is(":checked"),
                            r = jQuery(t).data("checkedvalue"),
                            o = jQuery(t).data("uncheckedvalue");
                        var h = a ? r : o;
                        e = e.replace(_, h);
                    } else if (!0 === l) {
                        if (!0 === jQuery(t).is(":checked")) {
                            let a = jQuery(t).data("val");
                            e = e.replace(_, a);
                        }
                    } else if (!0 === s) {
                        let e = jQuery(t).data("lookupelementindex"),
                            a = jQuery(t).data("identifier");
                        if (void 0 === n[a]) {
                            var g = { elementName: a, input1_label: "", input1: 0, input2_label: "", input2: 0 };
                            1 === e ? ((g.input1 = parseFloat(jQuery(t).val(), 10)), (g.input1_label = c)) : 2 === e && ((g.input2 = parseFloat(jQuery(t).val(), 10)), (g.input2_label = c)), (n[a] = g);
                        } else {
                            let r = n[a];
                            1 === e ? ((r.input1 = jQuery(t).val()), (r.input1_label = c)) : 2 === e && ((r.input2 = jQuery(t).val()), (r.input2_label = c));
                        }
                    } else {
                        let a = jQuery(t).val();
                        (a = parseFloat(a, 10)), (e = e.replace(_, a));
                    }
                } else {
                    var v = cpc_data.Elements.filter(function (e, a) {
                        if (e.Name === c) return e;
                    });
                    if (v.length > 0) {
                        let a = v[0].value_when_not_displayed;
                        if ((void 0 === a && (a = 1), "INPUT" == i)) {
                            f = generateSafeRegex(c + "[ActualValue]");
                            e = e.replace(f, a);
                        }
                        e = e.replace(_, a);
                    }
                    if (!0 === s) {
                        let a = jQuery(t).data("lookupelementindex"),
                            r = jQuery(t).data("identifier"),
                            o = cpc_data.Elements.filter(function (e, a) {
                                if (e.Name === r) return e;
                            });
                        if (o.length > 0) {
                            if (((_ = generateSafeRegex(r + "[" + c + "]")), (e = e.replace(_, 0)), 2 === a)) {
                                let a = o[0].value_when_not_displayed;
                                void 0 === a && (a = 1), (_ = generateSafeRegex(r)), (a = parseFloat(a, 10)), (e = e.replace(_, a));
                            }
                        }
                    }
                }
            }
        }),
        n)) {
            let a = n[l];
            var i = getCurrentElementDataByIdenfier(l);
            let t = a.elementName + "[" + a.input1_label + "]",
                r = a.elementName + "[" + a.input2_label + "]",
                o = generateSafeRegex(t);
            (e = e.replace(o, a.input1)), (o = generateSafeRegex(r)), (e = e.replace(o, a.input2));
            let c = i.sheet_data.input1_range.length - 1,
                u = i.sheet_data.input2_range.length - 1;
            for (let e = 0; e < i.sheet_data.input1_range.length - 1; e++)
                if (parseFloat(a.input1) >= parseFloat(i.sheet_data.input1_range[e]) && parseFloat(a.input1) < parseFloat(i.sheet_data.input1_range[e + 1])) {
                    c = e;
                    break;
                }
            for (let e = 0; e < i.sheet_data.input2_range.length - 1; e++)
                if (parseFloat(a.input2) >= parseFloat(i.sheet_data.input2_range[e]) && parseFloat(a.input2) < parseFloat(i.sheet_data.input2_range[e + 1])) {
                    u = e;
                    break;
                }
            0 === c && parseFloat(a.input1) > parseFloat(i.sheet_data.input1_range[i.sheet_data.input1_range.length - 1]) && (c = i.sheet_data.input1_range.length - 1),
                0 === u && parseFloat(a.input2) > parseFloat(i.sheet_data.input2_range[i.sheet_data.input2_range.length - 1]) && (u = i.sheet_data.input2_range.length - 1);
            let m = i.sheet_data.data_lookup[u][c];
            (o = generateSafeRegex(l)), (e = e.replace(o, m));
        }
        return e;
    } catch (e) {
        globalHelper_ReportError(e);
    }
}
function debounce(e, a, t) {
    var r;
    return function () {
        var o = this,
            n = arguments,
            l = t && !r;
        clearTimeout(r),
            (r = setTimeout(function () {
                (r = null), t || e.apply(o, n);
            }, a)),
            l && e.apply(o, n);
    };
}
jQuery(document).ready(function () {
    if (
        (void 0 === String.prototype.replaceAll &&
            (String.prototype.replaceAll = function (e, a) {
                return this.replace(new RegExp(e, "g"), () => a);
            }),
        !1 === cpc_pageLoaded)
    ) {
        if (((cpc_pageLoaded = !0), console.log("calculator loading"), "undefined" != typeof Shopify)) (cpc_shopUrl = Shopify.shop), void 0 !== window.meta.product && (cpc_productId = window.meta.product.id);
        else {
            console.log("calculator loading in preview mode");
            var e = $("#calculator_preview_storeurl").val();
            (cpc_shopUrl = e), (cpc_isPreview = !0);
        }
        null == document.querySelector('select[name="oldId"]') && DetectPage();
    }
}),
    $(window).ready(function () {
        PreventCheckoutOnEnter();
    });
var PriceUpdation = debounce(function (e) {
    UpdatePrice();
}, 500);
function ValidateInputs() {
    var e = !1;
    return (
        jQuery(".calc-prop").each((a, t) => {
            if (!1 === jQuery(t).is(":hidden")) {
                let a = jQuery(t).val(),
                    r = jQuery(t).data("isrequired"),
                    o = jQuery(t).is(":checked"),
                    n = t.type;
                void 0 !== r && 1 == r && (("checkbox" === n && !1 === o) || ("checkbox" !== n && a.length <= 0)) && (console.log("element-if-clause", t), (e = !0), jQuery(t).addClass("error-border"));
            }
        }),
        setTimeout(() => {
            ResetInputs();
        }, 3e3),
        e
    );
}
function getCurrentElementDataByIdenfier(e) {
    var a = cpc_data.Elements,
        t = null;
    return (
        a.forEach((a) => {
            a.Identifier === e && (t = a);
        }),
        t
    );
}
function generateSafeRegex(e) {
    return (
        (identifierForFormula = e.toLowerCase()),
        (identifierForFormula = identifierForFormula.replace(/\(/g, "\\(")),
        (identifierForFormula = identifierForFormula.replace(/\)/g, "\\)")),
        (identifierForFormula = identifierForFormula.replace(/\[/g, "\\[")),
        (identifierForFormula = identifierForFormula.replace(/\]/g, "\\]")),
        (identifierForFormula = identifierForFormula.replace(/\?/g, "\\?")),
        (identifierForFormula = identifierForFormula.replace(/\//g, "\\/")),
        (identifierForFormula = identifierForFormula.replace(/\+/g, "\\+")),
        new RegExp(identifierForFormula, "g")
    );
}
function ResetInputs() {
    jQuery(".calc-prop").each((e, a) => {
        jQuery(a).removeClass("error-border");
    });
}
function UpdateAllSelectedCheckBox() {
    jQuery(".checkbox-element .checkbox:checked").each((e, a) => {
        jQuery(a).val("Yes");
    });
}
function UpdateAllHiddenElements() {
    jQuery("#calculator .element:hidden").each((e, a) => {
        jQuery(a).remove();
    });
}
function loadScripts() {
    var e = document.createElement("link");
    e.setAttribute("rel", "stylesheet"),
        e.setAttribute("type", "text/css"),
        e.setAttribute("href", "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/themes/cupertino/jquery-ui.min.css"),
        document.getElementsByTagName("head")[0].appendChild(e);
    var a = document.createElement("script");
    a.setAttribute("src", "//code.jquery.com/ui/1.12.1/jquery-ui.js"), document.getElementsByTagName("head")[0].appendChild(a);
    var t = document.createElement("script");
    t.setAttribute("src", "//kit.fontawesome.com/9824551a84.js"), t.setAttribute("crossorigin", "anonymous"), document.getElementsByTagName("head")[0].appendChild(t);
}
function getCurrencyFormat(e) {
    switch (e.toUpperCase()) {
        case "USD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} USD" };
        case "EUR":
            return { money_format: "&euro;{{amount}}", money_with_currency_format: "&euro;{{amount}} EUR" };
        case "GBP":
            return { money_format: "&pound;{{amount}}", money_with_currency_format: "&pound;{{amount}} GBP" };
        case "CAD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} CAD" };
        case "ALL":
            return { money_format: "Lek {{amount}}", money_with_currency_format: "Lek {{amount}} ALL" };
        case "DZD":
            return { money_format: "DA {{amount}}", money_with_currency_format: "DA {{amount}} DZD" };
        case "AOA":
            return { money_format: "Kz{{amount}}", money_with_currency_format: "Kz{{amount}} AOA" };
        case "ARS":
            return { money_format: "${{amount_with_comma_separator}}", money_with_currency_format: "${{amount_with_comma_separator}} ARS" };
        case "AMD":
            return { money_format: "{{amount}} AMD", money_with_currency_format: "{{amount}} AMD" };
        case "AWG":
            return { money_format: "Afl{{amount}}", money_with_currency_format: "Afl{{amount}} AWG" };
        case "AUD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} AUD" };
        case "BBD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} Bds" };
        case "AZN":
            return { money_format: "m.{{amount}}", money_with_currency_format: "m.{{amount}} AZN" };
        case "BDT":
            return { money_format: "Tk {{amount}}", money_with_currency_format: "Tk {{amount}} BDT" };
        case "BSD":
            return { money_format: "BS${{amount}}", money_with_currency_format: "BS${{amount}} BSD" };
        case "BHD":
            return { money_format: "{{amount}}0 BD", money_with_currency_format: "{{amount}}0 BHD" };
        case "BYR":
            return { money_format: "Br {{amount}}", money_with_currency_format: "Br {{amount}} BYR" };
        case "BZD":
            return { money_format: "BZ${{amount}}", money_with_currency_format: "BZ${{amount}} BZD" };
        case "BTN":
            return { money_format: "Nu {{amount}}", money_with_currency_format: "Nu {{amount}} BTN" };
        case "BAM":
            return { money_format: "KM {{amount_with_comma_separator}}", money_with_currency_format: "KM {{amount_with_comma_separator}} BAM" };
        case "BRL":
            return { money_format: "R$ {{amount_with_comma_separator}}", money_with_currency_format: "R$ {{amount_with_comma_separator}} BRL" };
        case "BOB":
            return { money_format: "Bs{{amount_with_comma_separator}}", money_with_currency_format: "Bs{{amount_with_comma_separator}} BOB" };
        case "BWP":
            return { money_format: "P{{amount}}", money_with_currency_format: "P{{amount}} BWP" };
        case "BND":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} BND" };
        case "BGN":
            return { money_format: "{{amount}} лв", money_with_currency_format: "{{amount}} лв BGN" };
        case "MMK":
            return { money_format: "K{{amount}}", money_with_currency_format: "K{{amount}} MMK" };
        case "KHR":
            return { money_format: "KHR{{amount}}", money_with_currency_format: "KHR{{amount}}" };
        case "KYD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} KYD" };
        case "XAF":
            return { money_format: "FCFA{{amount}}", money_with_currency_format: "FCFA{{amount}} XAF" };
        case "CLP":
            return { money_format: "${{amount_no_decimals}}", money_with_currency_format: "${{amount_no_decimals}} CLP" };
        case "CNY":
            return { money_format: "&#165;{{amount}}", money_with_currency_format: "&#165;{{amount}} CNY" };
        case "COP":
            return { money_format: "${{amount_with_comma_separator}}", money_with_currency_format: "${{amount_with_comma_separator}} COP" };
        case "CRC":
            return { money_format: "&#8353; {{amount_with_comma_separator}}", money_with_currency_format: "&#8353; {{amount_with_comma_separator}} CRC" };
        case "HRK":
            return { money_format: "{{amount_with_comma_separator}} kn", money_with_currency_format: "{{amount_with_comma_separator}} kn HRK" };
        case "CZK":
            return { money_format: "{{amount_with_comma_separator}} K&#269;", money_with_currency_format: "{{amount_with_comma_separator}} K&#269;" };
        case "DKK":
            return { money_format: "{{amount_with_comma_separator}}", money_with_currency_format: "kr.{{amount_with_comma_separator}}" };
        case "DOP":
            return { money_format: "RD$ {{amount}}", money_with_currency_format: "RD$ {{amount}}" };
        case "XCD":
            return { money_format: "${{amount}}", money_with_currency_format: "EC${{amount}}" };
        case "EGP":
            return { money_format: "LE {{amount}}", money_with_currency_format: "LE {{amount}} EGP" };
        case "ETB":
            return { money_format: "Br{{amount}}", money_with_currency_format: "Br{{amount}} ETB" };
        case "XPF":
            return { money_format: "{{amount_no_decimals_with_comma_separator}} XPF", money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} XPF" };
        case "FJD":
            return { money_format: "${{amount}}", money_with_currency_format: "FJ${{amount}}" };
        case "GMD":
            return { money_format: "D {{amount}}", money_with_currency_format: "D {{amount}} GMD" };
        case "GHS":
            return { money_format: "GH&#8373;{{amount}}", money_with_currency_format: "GH&#8373;{{amount}}" };
        case "GTQ":
            return { money_format: "Q{{amount}}", money_with_currency_format: "{{amount}} GTQ" };
        case "GYD":
            return { money_format: "G${{amount}}", money_with_currency_format: "${{amount}} GYD" };
        case "GEL":
            return { money_format: "{{amount}} GEL", money_with_currency_format: "{{amount}} GEL" };
        case "HNL":
            return { money_format: "L {{amount}}", money_with_currency_format: "L {{amount}} HNL" };
        case "HKD":
            return { money_format: "${{amount}}", money_with_currency_format: "HK${{amount}}" };
        case "HUF":
            return { money_format: "{{amount_no_decimals_with_comma_separator}}", money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} Ft" };
        case "ISK":
            return { money_format: "{{amount_no_decimals}} kr", money_with_currency_format: "{{amount_no_decimals}} kr ISK" };
        case "INR":
            return { money_format: "Rs. {{amount}}", money_with_currency_format: "Rs. {{amount}}" };
        case "IDR":
            return { money_format: "{{amount_with_comma_separator}}", money_with_currency_format: "Rp {{amount_with_comma_separator}}" };
        case "ILS":
            return { money_format: "{{amount}} NIS", money_with_currency_format: "{{amount}} NIS" };
        case "JMD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} JMD" };
        case "JPY":
            return { money_format: "&#165;{{amount_no_decimals}}", money_with_currency_format: "&#165;{{amount_no_decimals}} JPY" };
        case "JEP":
            return { money_format: "&pound;{{amount}}", money_with_currency_format: "&pound;{{amount}} JEP" };
        case "JOD":
            return { money_format: "{{amount}}0 JD", money_with_currency_format: "{{amount}}0 JOD" };
        case "KZT":
            return { money_format: "{{amount}} KZT", money_with_currency_format: "{{amount}} KZT" };
        case "KES":
            return { money_format: "KSh{{amount}}", money_with_currency_format: "KSh{{amount}}" };
        case "KWD":
            return { money_format: "{{amount}}0 KD", money_with_currency_format: "{{amount}}0 KWD" };
        case "KGS":
            return { money_format: "лв{{amount}}", money_with_currency_format: "лв{{amount}}" };
        case "LVL":
            return { money_format: "Ls {{amount}}", money_with_currency_format: "Ls {{amount}} LVL" };
        case "LBP":
            return { money_format: "L&pound;{{amount}}", money_with_currency_format: "L&pound;{{amount}} LBP" };
        case "LTL":
            return { money_format: "{{amount}} Lt", money_with_currency_format: "{{amount}} Lt" };
        case "MGA":
            return { money_format: "Ar {{amount}}", money_with_currency_format: "Ar {{amount}} MGA" };
        case "MKD":
            return { money_format: "ден {{amount}}", money_with_currency_format: "ден {{amount}} MKD" };
        case "MOP":
            return { money_format: "MOP${{amount}}", money_with_currency_format: "MOP${{amount}}" };
        case "MVR":
            return { money_format: "Rf{{amount}}", money_with_currency_format: "Rf{{amount}} MRf" };
        case "MXN":
            return { money_format: "$ {{amount}}", money_with_currency_format: "$ {{amount}} MXN" };
        case "MYR":
            return { money_format: "RM{{amount}} MYR", money_with_currency_format: "RM{{amount}} MYR" };
        case "MUR":
            return { money_format: "Rs {{amount}}", money_with_currency_format: "Rs {{amount}} MUR" };
        case "MDL":
            return { money_format: "{{amount}} MDL", money_with_currency_format: "{{amount}} MDL" };
        case "MAD":
            return { money_format: "{{amount}} dh", money_with_currency_format: "Dh {{amount}} MAD" };
        case "MNT":
            return { money_format: "{{amount_no_decimals}} &#8366", money_with_currency_format: "{{amount_no_decimals}} MNT" };
        case "MZN":
            return { money_format: "{{amount}} Mt", money_with_currency_format: "Mt {{amount}} MZN" };
        case "NAD":
            return { money_format: "N${{amount}}", money_with_currency_format: "N${{amount}} NAD" };
        case "NPR":
            return { money_format: "Rs{{amount}}", money_with_currency_format: "Rs{{amount}} NPR" };
        case "ANG":
            return { money_format: "&fnof;{{amount}}", money_with_currency_format: "{{amount}} NA&fnof;" };
        case "NZD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} NZD" };
        case "NIO":
            return { money_format: "C${{amount}}", money_with_currency_format: "C${{amount}} NIO" };
        case "NGN":
            return { money_format: "&#8358;{{amount}}", money_with_currency_format: "&#8358;{{amount}} NGN" };
        case "NOK":
            return { money_format: "kr {{amount_with_comma_separator}}", money_with_currency_format: "kr {{amount_with_comma_separator}} NOK" };
        case "OMR":
            return { money_format: "{{amount_with_comma_separator}} OMR", money_with_currency_format: "{{amount_with_comma_separator}} OMR" };
        case "PKR":
            return { money_format: "Rs.{{amount}}", money_with_currency_format: "Rs.{{amount}} PKR" };
        case "PGK":
            return { money_format: "K {{amount}}", money_with_currency_format: "K {{amount}} PGK" };
        case "PYG":
            return { money_format: "Gs. {{amount_no_decimals_with_comma_separator}}", money_with_currency_format: "Gs. {{amount_no_decimals_with_comma_separator}} PYG" };
        case "PEN":
            return { money_format: "S/. {{amount}}", money_with_currency_format: "S/. {{amount}} PEN" };
        case "PHP":
            return { money_format: "&#8369;{{amount}}", money_with_currency_format: "&#8369;{{amount}} PHP" };
        case "PLN":
            return { money_format: "{{amount_with_comma_separator}} zl", money_with_currency_format: "{{amount_with_comma_separator}} zl PLN" };
        case "QAR":
            return { money_format: "QAR {{amount_with_comma_separator}}", money_with_currency_format: "QAR {{amount_with_comma_separator}}" };
        case "RON":
            return { money_format: "{{amount_with_comma_separator}} lei", money_with_currency_format: "{{amount_with_comma_separator}} lei RON" };
        case "RUB":
            return { money_format: "&#1088;&#1091;&#1073;{{amount_with_comma_separator}}", money_with_currency_format: "&#1088;&#1091;&#1073;{{amount_with_comma_separator}} RUB" };
        case "RWF":
            return { money_format: "{{amount_no_decimals}} RF", money_with_currency_format: "{{amount_no_decimals}} RWF" };
        case "WST":
            return { money_format: "WS$ {{amount}}", money_with_currency_format: "WS$ {{amount}} WST" };
        case "SAR":
            return { money_format: "{{amount}} SR", money_with_currency_format: "{{amount}} SAR" };
        case "STD":
            return { money_format: "Db {{amount}}", money_with_currency_format: "Db {{amount}} STD" };
        case "RSD":
            return { money_format: "{{amount}} RSD", money_with_currency_format: "{{amount}} RSD" };
        case "SCR":
            return { money_format: "Rs {{amount}}", money_with_currency_format: "Rs {{amount}} SCR" };
        case "SGD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} SGD" };
        case "SYP":
            return { money_format: "S&pound;{{amount}}", money_with_currency_format: "S&pound;{{amount}} SYP" };
        case "ZAR":
            return { money_format: "R {{amount}}", money_with_currency_format: "R {{amount}} ZAR" };
        case "KRW":
            return { money_format: "&#8361;{{amount_no_decimals}}", money_with_currency_format: "&#8361;{{amount_no_decimals}} KRW" };
        case "LKR":
            return { money_format: "Rs {{amount}}", money_with_currency_format: "Rs {{amount}} LKR" };
        case "SEK":
            return { money_format: "{{amount_no_decimals}} kr", money_with_currency_format: "{{amount_no_decimals}} kr SEK" };
        case "CHF":
            return { money_format: "SFr. {{amount}}", money_with_currency_format: "SFr. {{amount}} CHF" };
        case "TWD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} TWD" };
        case "THB":
            return { money_format: "{{amount}} &#xe3f;", money_with_currency_format: "{{amount}} &#xe3f; THB" };
        case "TZS":
            return { money_format: "{{amount}} TZS", money_with_currency_format: "{{amount}} TZS" };
        case "TTD":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}} TTD" };
        case "TND":
            return { money_format: "{{amount}}", money_with_currency_format: "{{amount}} DT" };
        case "TRY":
            return { money_format: "{{amount}}TL", money_with_currency_format: "{{amount}}TL" };
        case "UGX":
            return { money_format: "Ush {{amount_no_decimals}}", money_with_currency_format: "Ush {{amount_no_decimals}} UGX" };
        case "UAH":
            return { money_format: "₴{{amount}}", money_with_currency_format: "₴{{amount}} UAH" };
        case "AED":
            return { money_format: "Dhs. {{amount}}", money_with_currency_format: "Dhs. {{amount}} AED" };
        case "UYU":
            return { money_format: "${{amount_with_comma_separator}}", money_with_currency_format: "${{amount_with_comma_separator}} UYU" };
        case "VUV":
            return { money_format: "${{amount}}", money_with_currency_format: "${{amount}}VT" };
        case "VEF":
            return { money_format: "Bs. {{amount_with_comma_separator}}", money_with_currency_format: "Bs. {{amount_with_comma_separator}} VEF" };
        case "VND":
            return { money_format: "{{amount_no_decimals_with_comma_separator}}&#8363;", money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} VND" };
        case "XBT":
            return { money_format: "{{amount_no_decimals}} BTC", money_with_currency_format: "{{amount_no_decimals}} BTC" };
        case "XOF":
            return { money_format: "CFA{{amount}}", money_with_currency_format: "CFA{{amount}} XOF" };
        case "ZMW":
            return { money_format: "K{{amount_no_decimals_with_comma_separator}}", money_with_currency_format: "ZMW{{amount_no_decimals_with_comma_separator}}" };
    }
}
function formatMoney(e, a) {
    "string" == typeof e && (e = e.replace(".", ""));
    var t = "",
        r = /\{\{\s*(\w+)\s*\}\}/,
        o = a || "${{amount}}";
    function n(e, a) {
        return void 0 === e ? a : e;
    }
    function l(e, a, t, r) {
        if (((a = n(a, 2)), (t = n(t, ",")), (r = n(r, ".")), isNaN(e) || null == e)) return 0;
        var o = (e = (e / 100).toFixed(a)).split(".");
        return o[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + t) + (o[1] ? r + o[1] : "");
    }
    switch (o.match(r)[1]) {
        case "amount":
            t = l(e, 2);
            break;
        case "amount_no_decimals":
            t = l(e, 0);
            break;
        case "amount_with_comma_separator":
            t = l(e, 2, ".", ",");
            break;
        case "amount_no_decimals_with_comma_separator":
            t = l(e, 0, ".", ",");
    }
    return o.replace(r, t);
}
function buildDialogBlock() {
    return "<div style='display:none;'><div id='dialog' title='Basic dialog'><p>Your product isn't ready to go live. <br/>Delete all variants from the product and click save. <br/> </br/> Click <a target='_blank' href='https://apippa.freshdesk.com/support/solutions/articles/67000321459-add-to-cart-not-working'>here</a> to learn more.</p></div></div>";
}
function buildErrorBlock() {
    return "<div id='alert-block' class='hide-element alert float-left mt-4 w-100 clearfix alert-danger'>Please upload an image</div>";
}
function generateStep(e) {
    for (var a = "1"; a.length < e; ) a = "0" + a;
    return e > 0 && (a = "0." + a), parseFloat(a);
}
function showDialog() {
    jQuery("#dialog").dialog({ draggable: !1, resizable: !1, title: "Custom Price Calculator Alert!", width: 430, height: 230 });
}
function globalHelper_Escape(e) {
    return (e = e.replace(/\"/g, '\\"'));
}
function globalHelper_ReportError(e, a = "") {
    var t = window.location.href,
        r = JSON.stringify(e, Object.getOwnPropertyNames(e));
    (r = r + ", Msg1 = " + a + ", SourceUrl = " + t),
        jQuery
            .ajax({
                method: "POST",
                url: baseCalculatorApiUrl + "/api/analytics/errors",
                data: JSON.stringify({ calculatorId: cpc_calculatorId, productId: cpc_productId, error: r }),
                headers: { Accept: "application/json", "Content-Type": "application/json" },
            })
            .done(function () {});
}
function formatPricing(e, a, t) {
    let r;
    r = 1 === a ? "," : 2 === a ? "." : 3 === a ? " " : "";
    const o = 1 === t ? "," : ".",
        n = e.toFixed(priceMarkerDecimals).split(".");
    return n[0].replace(/\B(?=(\d{3})+(?!\d))/g, r) + (n.length > 1 ? o + n[1] : "");
}