sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit : function (sValue) {
            if (!sValue) {
				return "";
			}

			let returnValue = parseFloat(sValue).toFixed(3),
				x = returnValue.replace(".", ",");

			return x;
        },
        TotalQty:function(sValue){

            var oFormatOptions = {
                minFractionDigits: 2,
                maxFractionDigits: 4
            };
            var oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions);            

                if(!sValue || sValue === "0"){
                    return "";
                }
                return oFloatFormat.format(sValue);
        },

        changeNumber: function (iNumber) {
			return iNumber.replaceAll(".", "").replace(",", ".");
		},

        formatQuantity: function(quantity, meins) {
            if (!quantity) return "";

            // "adet" birimi olduğunda ondalık kısmı göstermeyin
            if (meins === "PC" || meins === "ADT" ) {
                return parseInt(quantity, 10).toLocaleString('tr-TR'); // Sadece tam sayı kısmını döndürür
            } 
            // Diğer durumlarda 3 ondalık basamağa kadar göster
            else {
                return parseFloat(quantity).toLocaleString('tr-TR', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3
                });
            }
        }



    };

});