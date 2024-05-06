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
            return parseFloat(sValue).toFixed(3);
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
        }


    };

});