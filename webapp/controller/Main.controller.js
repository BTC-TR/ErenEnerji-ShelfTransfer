sap.ui.define(
<<<<<<< HEAD
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/m/Text",
    "sap/m/TextArea"
  ],
  function (
    BaseController,
    JSONModel,
    formatter,
    Filter,
    FilterOperator,
    MessageBox,
    Fragment,
    Dialog,
    Button,
    Label,
    mobileLibrary,
    MessageToast,
    Text,
    TextArea
  ) {
    "use strict";

    return BaseController.extend("com.eren.addresstransfer.controller.Main", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: async function () {
        this.getRouter()
          .getRoute("RouteMain")
          .attachPatternMatched(this._onObjectMatched, this);
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      onLiveChangeBarcode: async function (oEvent) {

        let oBarcode = oEvent.getSource().getValue(),
          oKlgort = this.getModel("viewModel").getProperty("/Klgort"),


          oViewModel = this.getModel("viewModel"),
          fnSuccess = (oData) => {
            oViewModel.setProperty("/Owners", oData.results);
            let oSize = 0;

            if (oData.results.length === 1) {
              oViewModel.setProperty("/Guid", oData.results[oSize].GuidStock);
              oViewModel.setProperty("/OwnerText", oData.results[oSize].OwnerText);
              oViewModel.setProperty("/Owner", oData.results[oSize].Owner);

            }
            else {
              oSize = 1;
            }

            oViewModel.setProperty("/Meins", oData.results[oSize].Meins);
            oViewModel.setProperty("/Matnr", oData.results[oSize].Matnr);
            oViewModel.setProperty("/Maktx", oData.results[oSize].Maktx);
            if (oData.results.length === 1) {
              this._stockControl();  // Stock Control Function
            }

           // this.getView().byId("idOwners").open();
          },
          fnError = (err) => {
            let oMsg = JSON.parse(err.responseText).error.message.value;
            MessageBox.error(oMsg);
            oViewModel.setProperty("/Owners", []);
            oViewModel.setProperty("/Meins", "");
            oViewModel.setProperty("/Barcode", "");
            oViewModel.setProperty("/Matnr", "");
            oViewModel.setProperty("/Maktx", "");
            oViewModel.setProperty("/Quantity", "");
            oViewModel.setProperty("/StockInfo", "");
            oViewModel.setProperty("/Unit", "");
            oViewModel.setProperty("/Charg", "");
          },
          fnFinally = () => {
            oViewModel.setProperty("/busy", false);
            oViewModel.refresh(true);
          };
        await this._getBarcodeDetail(oBarcode, oKlgort)
          .then(fnSuccess)
          .catch(fnError)
          .finally(fnFinally);
      },

      onPressBarcode: async function (oEvent) {
        let oViewModel = this.getView().getModel("viewModel"),
          sCharg = this.getView().byId("idBarcode").getValue();
        let sDurum;
        oViewModel.setProperty("/Charg", sCharg.substr(sCharg.length - 10)),
          sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
        let sMatnr = oViewModel.getProperty("/Matnr"),
          sEntity = "/BarcodeQuery",
          oModel = this.getView().getModel("common_service"),
          sMethod = "GET",
          oURLParameters = {
            Charg: sCharg,
            Durum: sDurum,
            Matnr: sMatnr
          };
        oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
        this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
          .then((oData) => {
            if (oData.Type === "E") {
              MessageBox.error(oData.Message);
            }
            else {
              this._addNewItem();
            }

          })
          .catch(() => { })
          .finally((oResponse) => {

          });
      },

      onPressMatnr: async function (oEvent) {
        let sMatnr = this.getView().getModel("viewModel").getProperty("/Matnr"),
          oViewModel = this.getView().getModel("viewModel"),
          fnSuccess = (oData) => {
            sap.ui.core.BusyIndicator.hide();
            if (oData.EvMaktx) {
              oViewModel.setProperty("/Maktx", oData.EvMaktx);
            } else {
              oViewModel.setProperty("/Matnr", "");
              oViewModel.setProperty("/Maktx", "");
            }
          },
          fnError = err => {
            sap.ui.core.BusyIndicator.hide();
            MessageBox.error(JSON.parse(err.responseText).error.message.value);
            oViewModel.setProperty("/Matnr", "");
            oViewModel.setProperty("/Maktx", "");
          },
          fnFinally = () => {
            oViewModel.setProperty("/busy", false);
          };
        await this._getMatnrDetail(sMatnr)
          .then(fnSuccess)
          .catch(fnError)
          .finally(fnFinally);
      },

      //Matnr Search Help//
      handleValueHelpMatnr: async function (oEvent) {

        // create value help dialog
        if (!this._valueHelpDialogMatnr) {
          this._valueHelpDialogMatnr = sap.ui.xmlfragment(
            "com.eren.addresstransfer.fragment.valueHelp.Matnr",
            this
          );
          this.getView().addDependent(this._valueHelpDialogMatnr);
        }

        //-------------------------------------------------------------//
        // open value help dialog filtered by the input value
        this._valueHelpDialogMatnr.open();
      },
      handleValueHelpSearchMatnr: function (oEvent) {
        let sValue = oEvent.getParameter("value"),
          oFilter = new sap.ui.model.Filter({
            filters: [
              new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
              new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue),
            ],
            and: false
          });
        oEvent.getSource().getBinding("items").filter(oFilter);
      },
      handleValueHelpCloseMatnr: function (oEvent) {
        let oViewModel = this.getView().getModel("viewModel");
        let oSelectedItem = oEvent.getParameter("selectedItem");
        if (oSelectedItem) {
          oViewModel.setProperty("/Matnr", oSelectedItem.getTitle());
          oViewModel.setProperty("/Maktx", oSelectedItem.getDescription());
        }
        oEvent.getSource().getBinding("items").filter([]);
      },
      //Matnr Search Help//

      onValueHelpKlgort: function (oEvent) {
        let sInputValue = oEvent.getSource().getValue(),
          oViewModel = this.getModel("viewModel");
        this.inputId = oEvent.getSource().getId();
        // create value help dialog
        if (!this._valueHelpKlgort) {
          this._valueHelpKlgort = sap.ui.xmlfragment(
            "com.eren.addresstransfer.fragment.valueHelp.WareHouseKlgort",
            this
          );
          this.getView().addDependent(this._valueHelpKlgort);
        }

        //-------------------------------------------------------------//
        // open value help dialog filtered by the input value
        this._valueHelpKlgort.open(sInputValue);
      },
      onValueHelpHlgort: function (oEvent) {
        let sInputValue = oEvent.getSource().getValue(),
          oViewModel = this.getModel("viewModel");
        this.inputId = oEvent.getSource().getId();
        // create value help dialog
        if (!this._valueHelpHlgort) {
          this._valueHelpHlgort = sap.ui.xmlfragment(
            "com.eren.addresstransfer.fragment.valueHelp.WareHouseHlgort",
            this
          );
          this.getView().addDependent(this._valueHelpHlgort);
        }

        //-------------------------------------------------------------//
        // open value help dialog filtered by the input value
        this._valueHelpHlgort.open(sInputValue);
      },

      onStockQuery: async function () {
        let oCrossAppNavigator = sap.ushell.Container.getService(
          "CrossApplicationNavigation"
        ), // get a handle on the global XAppNav service
          hash =
            (oCrossAppNavigator &&
              oCrossAppNavigator.hrefForExternal({
                target: {
                  semanticObject: "Material",
                  action: "Query",
                },
              })) ||
            ""; // generate the Hash to display a Supplier
        oCrossAppNavigator.toExternal({
          target: {
            shellHash: hash,
          },
        }); // navigate to Supplier application
      },
      onPressItem: async function () {
        let oViewModel = this.getModel("viewModel");
        oViewModel.setProperty("/DeleteEnabled", true);
        oViewModel.refresh(true);
      },
      onPressDeleteItem: async function (oEvent) {


        let DialogType = mobileLibrary.DialogType,
          ButtonType = mobileLibrary.ButtonType;

        let oSelectedItems = this.getView()
          .byId("idTable")
          .getSelectedItems().length;
        if (oSelectedItems !== 1) {
          MessageBox.error(this._getResourceBundle().getText("errorItem"));
          return;
        }


        if (!this.oApproveDialog) {
          this.oApproveDialog = new Dialog({
            type: DialogType.Message,
            title: "Mesaj Kutusu",
            content: new Text({
              text: "Sat�r silinsin mi ?"
            }),
            beginButton: new Button({
              type: ButtonType.Emphasized,
              text: "Sil",
              press: function () {
                this._confirmDelete();
                this.oApproveDialog.close();
              }.bind(this),
            }),
            endButton: new Button({
              text: "Geri",
              press: function () {
                this.oApproveDialog.close();
              }.bind(this),
            }),
          });
        }

        this.oApproveDialog.open();

      },
      onPressRemoveSelections: function () {

        this.getView().byId("idTable").removeSelections();

      },
      onMessagePopoverPress: async function (oEvent) {
        let oSourceControl = oEvent.getSource();
        this._getMessagePopover().then(function (oMessagePopover) {
          oMessagePopover.openBy(oSourceControl);
        });
      },
      onClear: async function () {
        let oViewModel = this.getModel("viewModel");
        sap.ui.getCore().getMessageManager().removeAllMessages();

        oViewModel.setProperty("/Hlgort", "");
        oViewModel.setProperty("/valueStateKlgortT", "");
        oViewModel.setProperty("/valueStateHlgortT", "");
        oViewModel.setProperty("/valueStateHlgort", "None");
        oViewModel.setProperty("/valueStateKlgort", "None");
        oViewModel.setProperty("/Klgort", "");
        oViewModel.setProperty("/Matnr", "");
        oViewModel.setProperty("/Maktx", "");
        oViewModel.setProperty("/Owner", "");
        oViewModel.setProperty("/OwnerText", "");
        oViewModel.setProperty("/Guid", "");
        oViewModel.setProperty("/Charg", "");
        oViewModel.setProperty("/Quantity", "");
        oViewModel.setProperty("/StockInfo", "");
        oViewModel.setProperty("/Unit", "");
        oViewModel.setProperty("/Meins", "");
        oViewModel.setProperty("/Owners", []);
        jQuery.sap.delayedCall(500, this, function () {
          this.getView().byId("_IDGenInput1").focus();
        });

      },
      _onClearNewItem: async function () {
        let oViewModel = this.getModel("viewModel");
        sap.ui.getCore().getMessageManager().removeAllMessages();
        oViewModel.setProperty("/Owner", "");
        oViewModel.setProperty("/Matnr", "");
        oViewModel.setProperty("/Maktx", "");
        oViewModel.setProperty("/Charg", "");
        oViewModel.setProperty("/Quantity", "");
        oViewModel.setProperty("/StockInfo", "");
        oViewModel.setProperty("/Unit", "");
        oViewModel.setProperty("/Owners", []);
        jQuery.sap.delayedCall(200, this, function () {
          this.getView().byId("_IDGenInput3").focus();
        });
      },
      onSearchKlgort: function (oEvent) {
        let sValue = oEvent.getParameter("value"),
          oFilter = new sap.ui.model.Filter({
            filters: [
              new sap.ui.model.Filter(
                "Lgpla",
                sap.ui.model.FilterOperator.Contains,
                sValue
              ),
            ],
            and: false,
          });

        oEvent.getSource().getBinding("items").filter(oFilter);
      },
      onSearchHlgort: function (oEvent) {
        let sValue = oEvent.getParameter("value"),
          oFilter = new sap.ui.model.Filter({
            filters: [
              new sap.ui.model.Filter(
                "Lgpla",
                sap.ui.model.FilterOperator.Contains,
                sValue
              ),
            ],
            and: false,
          });
        oEvent.getSource().getBinding("items").filter(oFilter);
      },
      onCloseKlgort: function (oEvent) {
        let oSelectedItem = oEvent.getParameter("selectedItem"),
          oViewModel = this.getModel("viewModel");
        if (oSelectedItem) {
          let oInput = this.byId(this.inputId);

          oInput.setValue(oSelectedItem.getTitle());

          oViewModel.setProperty("/GenericKlgort", oSelectedItem.getTitle());
          oViewModel.setProperty(
            "/GenericKlgortT",
            oSelectedItem.getDescription()
          );
          oViewModel.setProperty("/Klgort", oSelectedItem.getTitle());
          this._onAddressCheckKlgort(oSelectedItem.getTitle());
          jQuery.sap.delayedCall(100, this, function () {
            this.getView().byId("_IDGenInput2").focus();
          });

          //     this._getLgnumType(oSelectedItem.getTitle());
        }
        oEvent.getSource().getBinding("items").filter([]);
      },
      onCloseHlgort: function (oEvent) {
        let oSelectedItem = oEvent.getParameter("selectedItem"),
          oViewModel = this.getModel("viewModel");
        if (oSelectedItem) {
          let oInput = this.byId(this.inputId);
          oInput.setValue(oSelectedItem.getTitle());

          oViewModel.setProperty("/GenericHlgort", oSelectedItem.getTitle());
          oViewModel.setProperty("/Hlgort", oSelectedItem.getTitle());
          jQuery.sap.delayedCall(100, this, function () {
            this.getView().byId("_IDGenInput3").focus();
          });


        }
        oEvent.getSource().getBinding("items").filter([]);
      },
      onSuggest: function (oEvent) {
        var sTerm = oEvent.getParameter("suggestValue");
        var aFilters = [];
        if (sTerm) {
          aFilters.push(new Filter("Lgpla", FilterOperator.StartsWith, sTerm));
        }

        oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
      },
      onChangeQuan: async function (oEvent) {
        let oViewModel = this.getModel("viewModel");
        let iQuan = oEvent.getSource().getValue(),
          iEvQuan = oViewModel.getProperty("/StockInfo");
        if (parseFloat(iQuan) > parseInt(iEvQuan)) {
          sap.m.MessageBox.error(this.getResourceBundle().getText("errorQuan"));
          oViewModel.setProperty("/Quantity", "");
        }
        else {
          this._onAddItem();
        }
      },
      onChangeOwner: async function (oEvent) {

        let oViewModel = this.getModel("viewModel"),
          oSelectedKey = oEvent.getSource().getSelectedItem().getKey(),
          oList = oViewModel.getProperty("/Owners"),
          oGuid = oList.filter(x => x.Owner === oSelectedKey);

        oViewModel.setProperty("/Guid", oGuid[0].GuidStock);
        oViewModel.setProperty("/OwnerText", oEvent.getSource().getSelectedItem().getText());
        this._stockControl();  // Stock Control Function

      },
      onSave: async function (oEvent) {

        let sEntity = "/SaveData",
          oModel = this.getView().getModel(),
          sMethod = "POST",
          oURLParameters = {};

        this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
          .then((oData) => {
            debugger;
            if (oData.Type === "E") {
              MessageBox.error(oData.Message);
            }
            else {
              MessageToast.show(oData.Message);
              this.onClear();
            }
          })
          .catch(() => { })
          .finally((oResponse) => {
            oModel.refresh(true);

          });



      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      /**
       * Triggered by the table's 'updateFinished' event: after new table
       * data is available, this handler method updates the table counter.
       * This should only happen if the update was successful, which is
       * why this handler is attached to 'updateFinished' and not to the
       * table's list binding's 'dataReceived' method.
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */

      _onObjectMatched: async function () {
        this.onClear();
        this._getMaterialSH();

        jQuery.sap.delayedCall(500, this, function () {
          this.getView().byId("_IDGenInput1").focus();
        });

      },
      _onAddItem: async function (oEvent) {
        let oViewModel = this.getView().getModel("viewModel"),
          sCharg = oViewModel.getProperty("/Charg"),
          sMatnr = oViewModel.getProperty("/Matnr"),
          sGuid = oViewModel.getProperty("/Guid"),
          sMeins = oViewModel.getProperty("/Meins"),
          sMiktar = oViewModel.getProperty("/Quantity"),
          sNlpla = oViewModel.getProperty("/Hlgort"),
          sOwner = oViewModel.getProperty("/Owner"),
          sOwnerText = oViewModel.getProperty("/OwnerText"),
          sVlpa = oViewModel.getProperty("/Klgort");

        let sEntity = "/AddData",
          oModel = this.getView().getModel(),
          sMethod = "POST",
          oURLParameters = {
            Charg: sCharg,
            Matnr: sMatnr,
            Guid: sGuid,
            Meins: sMeins,
            Miktar: formatter.changeNumber(sMiktar),
            Nlpla: sNlpla,
            Owner: sOwner,
            OwnerText: sOwnerText,
            Vlpla: sVlpa,
          };
        oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
        this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
          .then((oData) => {
            if (oData.Type === "E") {
              MessageBox.error(oData.Message);
            }
            else {
              MessageToast.show(oData.Message);
              this._onClearNewItem();
            }
          })
          .catch(() => { })
          .finally((oResponse) => {
            oModel.refresh(true);
          });
      },

      _getMatnrDetail: async function (sMatnr) {
        let oModel = this.getView().getModel("common_service");
        sap.ui.core.BusyIndicator.show(0);
        return new Promise((fnResolve, fnReject) => {
          let oParams = {
            success: fnResolve,
            error: fnReject
          },
            sPath = oModel.createKey("/MaterialSearchSet", {
              Matnr: sMatnr
            });
          oModel.read(sPath, oParams);
        });
      },
      onLgplaCheck: async function (oEvent) {

        let bValue = oEvent.getSource().getId().includes("IDGenInput1"),
          oViewModel = this.getModel("viewModel"),
          oLgpla = oEvent.getSource().getValue();
        let sEntity = "/AddressControl",
          oModel = this.getView().getModel("common_service"),
          sMethod = "GET",
          oURLParameters = {
            Lgnum: "ER01",
            Lgpla: oLgpla
          };
        oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
        this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
          .then((oData) => {
            if (oData.Type === "E") {
              if (bValue) {
                oViewModel.setProperty("/valueStateKlgort", "Error");
                oViewModel.setProperty("/Klgort", "");
              }
              else {
                oViewModel.setProperty("/valueStateHlgort", "Error");
                oViewModel.setProperty("/Hlgort", "");                
              }
            }
            else {
              if (bValue) {
                oViewModel.setProperty("/valueStateKlgort", "Success");
                jQuery.sap.delayedCall(100, this, function () {
                  this.getView().byId("_IDGenInput2").focus();
                });
              }
              else {
                oViewModel.setProperty("/valueStateHlgort", "Success");
                jQuery.sap.delayedCall(100, this, function () {
                  this.getView().byId("_IDGenInput3").focus();
                });
              }
            }
          })
          .catch(() => { })
          .finally((oResponse) => { });




      },

      _onAddressCheckKlgort: async function (oMatnr) {

      },


      _getMaterialSH: async function () {
        let oModel = this.getView().getModel();

        oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);

        let oViewModel = this.getView().getModel("viewModel"),
          fnSuccess = (oData) => {
            sap.ui.core.BusyIndicator.hide();
            if (oData.results.length > 0) {
              oViewModel.setProperty("/Materials", oData.results);
            }
            jQuery.sap.delayedCall(100, this, function () {
              this.getView().byId("_IDGenInput1").focus();
            });
          },
          fnError = err => { },
          fnFinally = () => { };

        await this._getMaterials()
          .then(fnSuccess)
          .catch(fnError)
          .finally(fnFinally);
      },
      _getMaterials: async function () {
        let oModel = this.getView().getModel("common_service"),
          sPath = "/MaterialSearchSet";

        return new Promise((fnResolve, fnReject) => {
          let oParams = {
            success: fnResolve,
            error: fnReject
          };
          oModel.read(sPath, oParams);
        });
      },
      _onLgnumAuthKlgort: async function (oMatnr) {
        let oViewModel = this.getModel("viewModel"),
          fnSuccess = (oData) => {

            if (oData.Type === "E") {
              oViewModel.setProperty("/valueStateKlgort", "Error");
              oViewModel.setProperty("/valueStateKlgortT", oData.Message);
              oViewModel.setProperty("/Klgort", "");
              jQuery.sap.delayedCall(200, this, function () {
                this.getView().byId("_IDGenInput1").focus();
              });
            } else {
              oViewModel.setProperty("/valueStateKlgort", "Success");
              oViewModel.setProperty("/valueStateKlgortT", oData.Message);

              jQuery.sap.delayedCall(200, this, function () {
                this.getView().byId("_IDGenInput2").focus();
              });
            }

          },
          fnError = (err) => { },
          fnFinally = () => {
            oViewModel.setProperty("/busy", false);
          };
        await this._getLgpla(oMatnr)
          .then(fnSuccess)
          .catch(fnError)
          .finally(fnFinally);
      },
      _onLgnumAuthHlgort: async function (oLgpla) {
        let oViewModel = this.getModel("viewModel"),
          fnSuccess = (oData) => {
            if (oData.Type === "E") {
              oViewModel.setProperty("/valueStateHlgort", "Error");
              oViewModel.setProperty("/valueStateHlgortT", oData.Message);
              oViewModel.setProperty("/Hlgort", "");
              jQuery.sap.delayedCall(200, this, function () {
                this.getView().byId("_IDGenInput2").focus();
              });
            } else {
              oViewModel.setProperty("/valueStateHlgort", "Success");
              oViewModel.setProperty("/valueStateHlgortT", oData.Message);
              jQuery.sap.delayedCall(200, this, function () {
                this.getView().byId("_IDGenInput3").focus();
              });
            }

          },
          fnError = (err) => { },
          fnFinally = () => {
            oViewModel.setProperty("/busy", false);
          };
        await this._getLgpla(oLgpla)
          .then(fnSuccess)
          .catch(fnError)
          .finally(fnFinally);
      },
      _showMessage: async function (oError) {
        let oTable = [],
          MessageModel = this.getModel("message"),
          oMessage = oError.split(">");
        if (oMessage.length > 2) {
          oTable.push({
            type: sap.ui.core.MessageType.Error,
            message: oMessage[5].split("<")[0],
          });
          MessageModel.setProperty("/", oTable);
        } else {
          oTable.push({
            type: sap.ui.core.MessageType.Error,
            message: oMessage[0],
          });
          MessageModel.setProperty("/", oTable);
        }
      },
      _getBarcodeDetail: async function (oBarcode, oKlgort) {
        let iBarcode = oBarcode.split("|"),
          sCharg = "",
          sMatnr = "",
          oModel = this.getModel(),
          oViewModel = this.getModel("viewModel"),
          sPath = "/BarcodeQuerySet";

        //E�er barkod | ile b�l�n�yorsa, 0. indis malzeme, 1. parti
        if (iBarcode.length === 2) {
          sCharg = iBarcode[1];
        }
        sMatnr = iBarcode[0];

        if (iBarcode[0].length >= 10 && oBarcode.includes("|") === false) {
          oViewModel.setProperty("/Charg", oBarcode.substr(oBarcode.length - 10));
          sMatnr = "";
          sCharg = oBarcode.substr(oBarcode.length - 10);
        }
        else {
          oViewModel.setProperty("/Charg", sCharg);
        }



        // oViewModel.setProperty("/Barcode", iBarcode[0]);
        oViewModel.setProperty("/Charg", sCharg);

        const aFilters = [
          new Filter("IvMatnr", FilterOperator.EQ, sMatnr),
          new Filter("IvCharg", FilterOperator.EQ, sCharg),
          new Filter("IvLgpla", FilterOperator.EQ, oKlgort)
        ];

        return new Promise(function (fnSuccess, fnReject) {
          const mParameters = {
            filters: aFilters,
            success: fnSuccess,
            error: fnReject
          };
          oModel.read(sPath, mParameters);
        });

      },
      _getLgpla: async function (oLgpla) {
        let oModel = this.getModel("common_service");

        return new Promise((fnResolve, fnReject) => {
          let oParams = {
            success: fnResolve,
            error: fnReject,
          },
            sPath = oModel.createKey("/LgplaSHSet", {
              Lgpla: oLgpla,
            });
          oModel.read(sPath, oParams);
        });
      },

      _focusAddress: function () {
        jQuery.sap.delayedCall(500, this, function () {
          this.getView().byId("_IDGenInput1").focus();
        });
      },
      _getMessageandFocus: function (oMessage) {
        var that = this;
        MessageBox.show(
          oMessage, {
          icon: MessageBox.Icon.INFORMATION,
          actions: [MessageBox.Action.OK],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (oAction) { that._focusAddress() }
        }
        );
      },
      _getMessagePopover: function () {
        let oView = this.getView();

        // create popover lazily (singleton)
        if (!this._pMessagePopover) {
          this._pMessagePopover = Fragment.load({
            id: oView.getId(),
            name: "com.eren.addresstransfer.fragment.message.MessagePopover",
          }).then(function (oMessagePopover) {
            oView.addDependent(oMessagePopover);
            return oMessagePopover;
          });
        }
        return this._pMessagePopover;
      },

      _formatQuantity: function (oQuantitiy) {
        return parseFloat(oQuantitiy);
      },


      _confirmDelete: function () {

        let oModel = this.getModel(),
          oViewModel = this.getModel("viewModel"),
          sPath = this.getView()
            .byId("idTable")
            .getSelectedItem()
            .getBindingContext().sPath;

        oModel.remove(sPath);
        this.getView().byId("idTable").removeSelections();
        oViewModel.setProperty("/DeleteEnabled", true);
        this.getModel().refresh(true);
      },
      _stockControl: async function () {
        let oViewModel = this.getModel("viewModel"),
          oCharg = oViewModel.getProperty("/Charg"),
          oLgnum = oViewModel.getProperty("/Lgnum"),
          oKlgort = oViewModel.getProperty("/Klgort"),
          oMatnr = oViewModel.getProperty("/Matnr"),
          oOwner = oViewModel.getProperty("/Owner");

        let fnSuccess = (oData) => {
          if (oData.EvQuan) {
            oViewModel.setProperty("/StockInfo", parseFloat(oData.EvQuan));
            oViewModel.setProperty("/Unit", oData.EvUnit);
            jQuery.sap.delayedCall(100, this, function () {
              this.getView().byId("_IDGenText23").focus();
            });
          } else {
            if (oData.Message) {
              sap.m.MessageBox.error(oData.Message);
            }
          }
        },
          fnError = (err) => {
            let errorObj1 = JSON.parse(err.responseText);
            sap.m.MessageBox.error(errorObj1.error.message.value);
          },
          fnFinally = () => {
            sap.ui.core.BusyIndicator.hide();
            oViewModel.setProperty("/busy", false);
          };
        await this._checkStock(oCharg, oLgnum, oKlgort, oMatnr, oOwner)
          .then(fnSuccess)
          .catch(fnError)
          .finally(fnFinally);


      },
      _checkStock: async function (oCharg, oLgnum, oKlgort, oMatnr, oOwner) {

        let oModel = this.getModel();


        return new Promise((fnResolve, fnReject) => {
          let oParams = {
            success: fnResolve,
            error: fnReject,
          },
            sPath = oModel.createKey("/StockControlSet", {
              IvCharg: oCharg,
              IvLgnum: oLgnum,
              IvLgpla: oKlgort,
              IvMatnr: oMatnr,
              IvOwner: oOwner

            });
          oModel.read(sPath, oParams);
        });
      }
    });
  }
=======
	[
		"./BaseController",
		"sap/ui/model/json/JSONModel",
		"../model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageBox",
		"sap/ui/core/Fragment",
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/m/Label",
		"sap/m/library",
		"sap/m/MessageToast",
		"sap/m/Text",
		"sap/m/TextArea"
	],
	function(
		BaseController,
		JSONModel,
		formatter,
		Filter,
		FilterOperator,
		MessageBox,
		Fragment,
		Dialog,
		Button,
		Label,
		mobileLibrary,
		MessageToast,
		Text,
		TextArea
	) {
		"use strict";

		return BaseController.extend("com.eren.addresstransfer.controller.Main", {
			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit: async function() {
				this.getRouter()
					.getRoute("RouteMain")
					.attachPatternMatched(this._onObjectMatched, this);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */
			onLiveChangeBarcode: async function(oEvent) {

				let oBarcode = oEvent.getSource().getValue().trim(),
					oKlgort = this.getModel("viewModel").getProperty("/Klgort"),

					oViewModel = this.getModel("viewModel"),
					fnSuccess = (oData) => {
						oViewModel.setProperty("/Owners", oData.results);
						let oSize = 0;

						if (oData.results.length === 1) {
							oViewModel.setProperty("/Guid", oData.results[oSize].GuidStock);
							oViewModel.setProperty("/OwnerText", oData.results[oSize].OwnerText);
							oViewModel.setProperty("/Owner", oData.results[oSize].Owner);

						} else {
							oSize = 1;
						}

						oViewModel.setProperty("/Meins", oData.results[oSize].Meins);
						oViewModel.setProperty("/Matnr", oData.results[oSize].Matnr);
						oViewModel.setProperty("/Maktx", oData.results[oSize].Maktx);
						if (oData.results.length === 1) {
							this._stockControl(); // Stock Control Function
						}

					},
					fnError = (err) => {
						let oMsg = JSON.parse(err.responseText).error.message.value;
						MessageBox.error(oMsg);
						oViewModel.setProperty("/Owners", []);
						oViewModel.setProperty("/Meins", "");
						oViewModel.setProperty("/Barcode", "");
						oViewModel.setProperty("/Matnr", "");
						oViewModel.setProperty("/Maktx", "");
						oViewModel.setProperty("/Quantity", "");
						oViewModel.setProperty("/StockInfo", "");
						oViewModel.setProperty("/Unit", "");
						oViewModel.setProperty("/Charg", "");
					},
					fnFinally = () => {
						oViewModel.setProperty("/busy", false);
						oViewModel.refresh(true);
					};
				await this._getBarcodeDetail(oBarcode, oKlgort)
					.then(fnSuccess)
					.catch(fnError)
					.finally(fnFinally);
			},

			onPressBarcode: async function(oEvent) {
				let oViewModel = this.getView().getModel("viewModel"),
					sCharg = this.getView().byId("idBarcode").getValue();
				let sDurum;
				oViewModel.setProperty("/Charg", sCharg.substr(sCharg.length - 10)),
					sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
				let sMatnr = oViewModel.getProperty("/Matnr"),
					sEntity = "/BarcodeQuery",
					oModel = this.getView().getModel("common_service"),
					sMethod = "GET",
					oURLParameters = {
						Charg: sCharg,
						Durum: sDurum,
						Matnr: sMatnr
					};
				oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
				this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
					.then((oData) => {
						if (oData.Type === "E") {
							MessageBox.error(oData.Message);
						} else {
							this._addNewItem();
						}

					})
					.catch(() => {})
					.finally((oResponse) => {

					});
			},

			onPressMatnr: async function(oEvent) {
				let sMatnr = this.getView().getModel("viewModel").getProperty("/Matnr"),
					oViewModel = this.getView().getModel("viewModel"),
					fnSuccess = (oData) => {
						sap.ui.core.BusyIndicator.hide();
						if (oData.EvMaktx) {
							oViewModel.setProperty("/Maktx", oData.EvMaktx);
						} else {
							oViewModel.setProperty("/Matnr", "");
							oViewModel.setProperty("/Maktx", "");
						}
					},
					fnError = err => {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error(JSON.parse(err.responseText).error.message.value);
						oViewModel.setProperty("/Matnr", "");
						oViewModel.setProperty("/Maktx", "");
					},
					fnFinally = () => {
						oViewModel.setProperty("/busy", false);
					};
				await this._getMatnrDetail(sMatnr)
					.then(fnSuccess)
					.catch(fnError)
					.finally(fnFinally);
			},

			//Matnr Search Help//
			handleValueHelpMatnr: async function(oEvent) {

				// create value help dialog
				if (!this._valueHelpDialogMatnr) {
					this._valueHelpDialogMatnr = sap.ui.xmlfragment(
						"com.eren.addresstransfer.fragment.valueHelp.Matnr",
						this
					);
					this.getView().addDependent(this._valueHelpDialogMatnr);
				}

				//-------------------------------------------------------------//
				// open value help dialog filtered by the input value
				this._valueHelpDialogMatnr.open();
			},
			handleValueHelpSearchMatnr: function(oEvent) {
				let sValue = oEvent.getParameter("value"),
					oFilter = new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
							new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue),
						],
						and: false
					});
				oEvent.getSource().getBinding("items").filter(oFilter);
			},
			handleValueHelpCloseMatnr: function(oEvent) {
				let oViewModel = this.getView().getModel("viewModel");
				let oSelectedItem = oEvent.getParameter("selectedItem");
				if (oSelectedItem) {
					oViewModel.setProperty("/Matnr", oSelectedItem.getTitle());
					oViewModel.setProperty("/Maktx", oSelectedItem.getDescription());
				}
				oEvent.getSource().getBinding("items").filter([]);
			},
			//Matnr Search Help//

			onValueHelpKlgort: function(oEvent) {
				let sInputValue = oEvent.getSource().getValue(),
					oViewModel = this.getModel("viewModel");
				this.inputId = oEvent.getSource().getId();
				// create value help dialog
				if (!this._valueHelpKlgort) {
					this._valueHelpKlgort = sap.ui.xmlfragment(
						"com.eren.addresstransfer.fragment.valueHelp.WareHouseKlgort",
						this
					);
					this.getView().addDependent(this._valueHelpKlgort);
				}

				//-------------------------------------------------------------//
				// open value help dialog filtered by the input value
				this._valueHelpKlgort.open(sInputValue);
			},
			onValueHelpHlgort: function(oEvent) {
				let sInputValue = oEvent.getSource().getValue(),
					oViewModel = this.getModel("viewModel");
				this.inputId = oEvent.getSource().getId();
				// create value help dialog
				if (!this._valueHelpHlgort) {
					this._valueHelpHlgort = sap.ui.xmlfragment(
						"com.eren.addresstransfer.fragment.valueHelp.WareHouseHlgort",
						this
					);
					this.getView().addDependent(this._valueHelpHlgort);
				}

				//-------------------------------------------------------------//
				// open value help dialog filtered by the input value
				this._valueHelpHlgort.open(sInputValue);
			},

			onStockQuery: async function() {
				let oCrossAppNavigator = sap.ushell.Container.getService(
						"CrossApplicationNavigation"
					), // get a handle on the global XAppNav service
					hash =
					(oCrossAppNavigator &&
						oCrossAppNavigator.hrefForExternal({
							target: {
								semanticObject: "Material",
								action: "Query",
							},
						})) ||
					""; // generate the Hash to display a Supplier
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: hash,
					},
				}); // navigate to Supplier application
			},
			onPressItem: async function() {
				let oViewModel = this.getModel("viewModel");
				oViewModel.setProperty("/DeleteEnabled", true);
				oViewModel.refresh(true);
			},
			onPressDeleteItem: async function(oEvent) {

				let DialogType = mobileLibrary.DialogType,
					ButtonType = mobileLibrary.ButtonType;

				let oSelectedItems = this.getView()
					.byId("idTable")
					.getSelectedItems().length;
				if (oSelectedItems !== 1) {
					MessageBox.error(this._getResourceBundle().getText("errorItem"));
					return;
				}

				if (!this.oApproveDialog) {
					this.oApproveDialog = new Dialog({
						type: DialogType.Message,
						title: "Mesaj Kutusu",
						content: new Text({
							text: "Satır silinsin mi ?"
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Sil",
							press: function() {
								this._confirmDelete();
								this.oApproveDialog.close();
							}.bind(this),
						}),
						endButton: new Button({
							text: "Geri",
							press: function() {
								this.oApproveDialog.close();
							}.bind(this),
						}),
					});
				}

				this.oApproveDialog.open();

			},
			onPressRemoveSelections: function() {

				this.getView().byId("idTable").removeSelections();

			},
			onMessagePopoverPress: async function(oEvent) {
				let oSourceControl = oEvent.getSource();
				this._getMessagePopover().then(function(oMessagePopover) {
					oMessagePopover.openBy(oSourceControl);
				});
			},
			onClear: async function() {
				let oViewModel = this.getModel("viewModel");
				sap.ui.getCore().getMessageManager().removeAllMessages();

				oViewModel.setProperty("/Hlgort", "");
				oViewModel.setProperty("/valueStateKlgortT", "");
				oViewModel.setProperty("/valueStateHlgortT", "");
				oViewModel.setProperty("/valueStateHlgort", "None");
				oViewModel.setProperty("/valueStateKlgort", "None");
				oViewModel.setProperty("/Klgort", "");
				oViewModel.setProperty("/Matnr", "");
				oViewModel.setProperty("/Maktx", "");
				oViewModel.setProperty("/Owner", "");
				oViewModel.setProperty("/OwnerText", "");
				oViewModel.setProperty("/Guid", "");
				oViewModel.setProperty("/Charg", "");
				oViewModel.setProperty("/Quantity", "");
				this.getView().byId("idQuantity").setValue("");
				oViewModel.setProperty("/StockInfo", "");
				oViewModel.setProperty("/Unit", "");
				oViewModel.setProperty("/Meins", "");
				oViewModel.setProperty("/Owners", []);
				jQuery.sap.delayedCall(500, this, function() {
					this.getView().byId("_IDGenInput1").focus();
				});

			},
			_onClearNewItem: async function() {
				let oViewModel = this.getModel("viewModel");
				sap.ui.getCore().getMessageManager().removeAllMessages();
				oViewModel.setProperty("/Owner", "");
				oViewModel.setProperty("/Matnr", "");
				oViewModel.setProperty("/Maktx", "");
				oViewModel.setProperty("/Charg", "");
				oViewModel.setProperty("/Quantity", "");
				this.getView().byId("idQuantity").setValue("");
				oViewModel.setProperty("/StockInfo", "");
				oViewModel.setProperty("/Unit", "");
				oViewModel.setProperty("/Owners", []);
				jQuery.sap.delayedCall(200, this, function() {
					this.getView().byId("_IDGenInput3").focus();
				});
			},
			onSearchKlgort: function(oEvent) {
				let sValue = oEvent.getParameter("value").toUpperCase(),
					oFilter = new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter(
								"Lgpla",
								sap.ui.model.FilterOperator.Contains,
								sValue
							),
						],
						and: false,
					});

				oEvent.getSource().getBinding("items").filter(oFilter);
			},
			onSearchHlgort: function(oEvent) {
				let sValue = oEvent.getParameter("value").toUpperCase(),
					oFilter = new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter(
								"Lgpla",
								sap.ui.model.FilterOperator.Contains,
								sValue
							),
						],
						and: false,
					});
				oEvent.getSource().getBinding("items").filter(oFilter);
			},
			onCloseKlgort: function(oEvent) {
				let oSelectedItem = oEvent.getParameter("selectedItem"),
					oViewModel = this.getModel("viewModel");
				if (oSelectedItem) {
					let oInput = this.byId(this.inputId);

					oInput.setValue(oSelectedItem.getTitle());

					oViewModel.setProperty("/GenericKlgort", oSelectedItem.getTitle());
					oViewModel.setProperty(
						"/GenericKlgortT",
						oSelectedItem.getDescription()
					);
					oViewModel.setProperty("/Klgort", oSelectedItem.getTitle());
					this._onAddressCheckKlgort(oSelectedItem.getTitle());

					//     this._getLgnumType(oSelectedItem.getTitle());
				}
				oEvent.getSource().getBinding("items").filter([]);
			},
			onCloseHlgort: function(oEvent) {
				let oSelectedItem = oEvent.getParameter("selectedItem"),
					oViewModel = this.getModel("viewModel");
				if (oSelectedItem) {
					let oInput = this.byId(this.inputId);
					oInput.setValue(oSelectedItem.getTitle());

					oViewModel.setProperty("/GenericHlgort", oSelectedItem.getTitle());
					oViewModel.setProperty("/Hlgort", oSelectedItem.getTitle());

				}
				oEvent.getSource().getBinding("items").filter([]);
			},
			onSuggest: function(oEvent) {
				var sTerm = oEvent.getParameter("suggestValue");
				var aFilters = [];
				if (sTerm) {
					aFilters.push(new Filter("Lgpla", FilterOperator.StartsWith, sTerm));
				}

				oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
			},
			onChangeQuan: async function(oEvent) {
				let iQuantity = this.getView().byId("idQuantity"),
					oViewModel = this.getModel("viewModel"),
					iQuan = oEvent.getSource().getValue(),
					iEvQuan = oViewModel.getProperty("/StockInfo"),
					iMeins = oViewModel.getProperty("/Meins"),
					that = this,
					formettedNumber = formatter.changeNumber(iQuan);

				if (parseFloat(formettedNumber) > parseInt(iEvQuan)) {
					sap.m.MessageBox.error(
						this.getResourceBundle().getText("errorQuan", [parseFloat(formettedNumber), parseInt(iEvQuan), iMeins]));
					iQuantity.setValue("");
				} else if (iMeins === "ADT" || iMeins === "PC") {
					let isInteger = Number.isInteger(parseFloat(formettedNumber));
					if (isInteger) {
						this._onAddItem();
					} else {

						sap.m.MessageBox.show(this.getResourceBundle().getText("errorQuanPC", [parseFloat(formettedNumber), iMeins]), {
							icon: sap.m.MessageBox.Icon.QUESTION,
							title: "Yuvarlama Seçimi",
							actions: [
								"Yukarı",
								"Aşağı",
								sap.m.MessageBox.Action.CANCEL
							],
							onClose: function(oAction) {
								let inputNumber = parseFloat(formettedNumber);
								let result;

								if (oAction === "Yukarı") {
									result = Math.ceil(inputNumber);
									iQuantity.setValue(result);
									that._onAddItem();
								} else if (oAction === "Aşağı") {
									result = Math.floor(inputNumber);
									iQuantity.setValue(result);
									that._onAddItem();
								} else if (oAction === sap.m.MessageBox.Action.CANCEL) {
									iQuantity.setValue("");
								}
							}
						});

					}

				} else {
					this._onAddItem();
				}
			},
			onChangeOwner: async function(oEvent) {

				let oViewModel = this.getModel("viewModel"),
					oSelectedKey = oEvent.getSource().getSelectedItem().getKey(),
					oList = oViewModel.getProperty("/Owners"),
					oGuid = oList.filter(x => x.Owner === oSelectedKey);

				oViewModel.setProperty("/Guid", oGuid[0].GuidStock);
				oViewModel.setProperty("/OwnerText", oEvent.getSource().getSelectedItem().getText());
				this._stockControl(); // Stock Control Function

			},
			onSave: async function(oEvent) {

				let sEntity = "/SaveData",
					oModel = this.getView().getModel(),
					sMethod = "POST",
					oURLParameters = {};

				this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
					.then((oData) => {
						debugger;
						if (oData.Type === "E") {
							MessageBox.error(oData.Message);
						} else {
							MessageToast.show(oData.Message);
							this.onClear();
						}
					})
					.catch(() => {})
					.finally((oResponse) => {
						oModel.refresh(true);

					});

			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */

			_onObjectMatched: async function() {
				this.onClear();
				this._getMaterialSH();

				jQuery.sap.delayedCall(100, this, function() {
					this.getView().byId("_IDGenInput1").focus();
				});

			},
			_onAddItem: async function(oEvent) {

				let oViewModel = this.getView().getModel("viewModel"),
					sCharg = oViewModel.getProperty("/Charg"),
					sMatnr = oViewModel.getProperty("/Matnr"),
					sGuid = oViewModel.getProperty("/Guid"),
					sMeins = oViewModel.getProperty("/Meins"),
					//sMiktar = oViewModel.getProperty("/Quantity"),
					sNlpla = oViewModel.getProperty("/Hlgort"),
					sOwner = oViewModel.getProperty("/Owner"),
					sOwnerText = oViewModel.getProperty("/OwnerText"),
					sVlpa = oViewModel.getProperty("/Klgort");

				let sMiktar = this.getView().byId("idQuantity").getValue();

				let sEntity = "/AddData",
					oModel = this.getView().getModel(),
					sMethod = "POST",
					oURLParameters = {
						Charg: sCharg,
						Matnr: sMatnr,
						Guid: sGuid,
						Meins: sMeins,
						//Miktar: formatter.changeNumber(sMiktar),
						Miktar: formatter.changeNumber(sMiktar),
						Nlpla: sNlpla,
						Owner: sOwner,
						OwnerText: sOwnerText,
						Vlpla: sVlpa,
					};
				oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
				this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
					.then((oData) => {
						if (oData.Type === "E") {
							MessageBox.error(oData.Message);
						} else {
							MessageToast.show(oData.Message);
							this._onClearNewItem();
						}
					})
					.catch(() => {})
					.finally((oResponse) => {
						oModel.refresh(true);
					});
			},

			_getMatnrDetail: async function(sMatnr) {
				let oModel = this.getView().getModel("common_service");
				sap.ui.core.BusyIndicator.show(0);
				return new Promise((fnResolve, fnReject) => {
					let oParams = {
							success: fnResolve,
							error: fnReject
						},
						sPath = oModel.createKey("/MaterialSearchSet", {
							Matnr: sMatnr
						});
					oModel.read(sPath, oParams);
				});
			},
			onLgplaCheck: async function(oEvent) {

				let bValue = oEvent.getSource().getId().includes("IDGenInput1"),
					oViewModel = this.getModel("viewModel"),
					oLgpla = oEvent.getSource().getValue();
				let sEntity = "/AddressControl",
					oModel = this.getView().getModel("common_service"),
					sMethod = "GET",
					oURLParameters = {
						Lgnum: "ER01",
						Lgpla: oLgpla
					};
				oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
				this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
					.then((oData) => {
						if (oData.Type === "E") {
							if (bValue) {
								oViewModel.setProperty("/valueStateKlgort", "Error");
								oViewModel.setProperty("/Klgort", "");
							} else {
								oViewModel.setProperty("/valueStateHlgort", "Error");
								oViewModel.setProperty("/Hlgort", "");
							}
						} else {
							if (bValue) {
								oViewModel.setProperty("/valueStateKlgort", "Success");
							} else {
								oViewModel.setProperty("/valueStateHlgort", "Success");
							}
						}
					})
					.catch(() => {})
					.finally((oResponse) => {});

			},

			_onAddressCheckKlgort: async function(oMatnr) {

			},

			_getMaterialSH: async function() {
				let oModel = this.getView().getModel();

				oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);

				let oViewModel = this.getView().getModel("viewModel"),
					fnSuccess = (oData) => {
						sap.ui.core.BusyIndicator.hide();
						if (oData.results.length > 0) {
							oViewModel.setProperty("/Materials", oData.results);
						}
					},
					fnError = err => {},
					fnFinally = () => {};

				await this._getMaterials()
					.then(fnSuccess)
					.catch(fnError)
					.finally(fnFinally);
			},
			_getMaterials: async function() {
				let oModel = this.getView().getModel("common_service"),
					sPath = "/MaterialSearchSet";

				return new Promise((fnResolve, fnReject) => {
					let oParams = {
						success: fnResolve,
						error: fnReject
					};
					oModel.read(sPath, oParams);
				});
			},
			_onLgnumAuthKlgort: async function(oMatnr) {
				let oViewModel = this.getModel("viewModel"),
					fnSuccess = (oData) => {

						if (oData.Type === "E") {
							oViewModel.setProperty("/valueStateKlgort", "Error");
							oViewModel.setProperty("/valueStateKlgortT", oData.Message);
							oViewModel.setProperty("/Klgort", "");
							jQuery.sap.delayedCall(200, this, function() {
								this.getView().byId("_IDGenInput1").focus();
							});
						} else {
							oViewModel.setProperty("/valueStateKlgort", "Success");
							oViewModel.setProperty("/valueStateKlgortT", oData.Message);

							jQuery.sap.delayedCall(200, this, function() {
								this.getView().byId("_IDGenInput2").focus();
							});
						}

					},
					fnError = (err) => {},
					fnFinally = () => {
						oViewModel.setProperty("/busy", false);
					};
				await this._getLgpla(oMatnr)
					.then(fnSuccess)
					.catch(fnError)
					.finally(fnFinally);
			},
			_onLgnumAuthHlgort: async function(oLgpla) {
				let oViewModel = this.getModel("viewModel"),
					fnSuccess = (oData) => {
						if (oData.Type === "E") {
							oViewModel.setProperty("/valueStateHlgort", "Error");
							oViewModel.setProperty("/valueStateHlgortT", oData.Message);
							oViewModel.setProperty("/Hlgort", "");
							jQuery.sap.delayedCall(200, this, function() {
								this.getView().byId("_IDGenInput2").focus();
							});
						} else {
							oViewModel.setProperty("/valueStateHlgort", "Success");
							oViewModel.setProperty("/valueStateHlgortT", oData.Message);
							jQuery.sap.delayedCall(200, this, function() {
								this.getView().byId("_IDGenInput3").focus();
							});
						}

					},
					fnError = (err) => {},
					fnFinally = () => {
						oViewModel.setProperty("/busy", false);
					};
				await this._getLgpla(oLgpla)
					.then(fnSuccess)
					.catch(fnError)
					.finally(fnFinally);
			},
			_showMessage: async function(oError) {
				let oTable = [],
					MessageModel = this.getModel("message"),
					oMessage = oError.split(">");
				if (oMessage.length > 2) {
					oTable.push({
						type: sap.ui.core.MessageType.Error,
						message: oMessage[5].split("<")[0],
					});
					MessageModel.setProperty("/", oTable);
				} else {
					oTable.push({
						type: sap.ui.core.MessageType.Error,
						message: oMessage[0],
					});
					MessageModel.setProperty("/", oTable);
				}
			},
			_getBarcodeDetail: async function(oBarcode, oKlgort) {
				let iBarcode = oBarcode.split("|"),
					sCharg = "",
					sMatnr = "",
					oModel = this.getModel(),
					oViewModel = this.getModel("viewModel"),
					sPath = "/BarcodeQuerySet";

				//Eğer barkod | ile bölünüyorsa, 0. indis malzeme, 1. parti
				if (iBarcode.length === 2) {
					sCharg = iBarcode[1];
				}
				sMatnr = iBarcode[0];

				if (iBarcode[0].length >= 10 && oBarcode.includes("|") === false) {
					oViewModel.setProperty("/Charg", oBarcode.substr(oBarcode.length - 10));
					sMatnr = "";
					sCharg = oBarcode.substr(oBarcode.length - 10);
				} else {
					oViewModel.setProperty("/Charg", sCharg);
				}

				// oViewModel.setProperty("/Barcode", iBarcode[0]);
				oViewModel.setProperty("/Charg", sCharg);

				const aFilters = [
					new Filter("IvMatnr", FilterOperator.EQ, sMatnr),
					new Filter("IvCharg", FilterOperator.EQ, sCharg),
					new Filter("IvLgpla", FilterOperator.EQ, oKlgort)
				];

				return new Promise(function(fnSuccess, fnReject) {
					const mParameters = {
						filters: aFilters,
						success: fnSuccess,
						error: fnReject
					};
					oModel.read(sPath, mParameters);
				});

			},
			_getLgpla: async function(oLgpla) {
				let oModel = this.getModel("common_service");

				return new Promise((fnResolve, fnReject) => {
					let oParams = {
							success: fnResolve,
							error: fnReject,
						},
						sPath = oModel.createKey("/LgplaSHSet", {
							Lgpla: oLgpla,
						});
					oModel.read(sPath, oParams);
				});
			},

			_focusAddress: function() {
				jQuery.sap.delayedCall(500, this, function() {
					this.getView().byId("_IDGenInput1").focus();
				});
			},
			_getMessageandFocus: function(oMessage) {
				var that = this;
				MessageBox.show(
					oMessage, {
						icon: MessageBox.Icon.INFORMATION,
						actions: [MessageBox.Action.OK],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function(oAction) {
							that._focusAddress()
						}
					}
				);
			},
			_getMessagePopover: function() {
				let oView = this.getView();

				// create popover lazily (singleton)
				if (!this._pMessagePopover) {
					this._pMessagePopover = Fragment.load({
						id: oView.getId(),
						name: "com.eren.addresstransfer.fragment.message.MessagePopover",
					}).then(function(oMessagePopover) {
						oView.addDependent(oMessagePopover);
						return oMessagePopover;
					});
				}
				return this._pMessagePopover;
			},

			_formatQuantity: function(oQuantitiy) {
				return parseFloat(oQuantitiy);
			},

			_confirmDelete: function() {

				let oModel = this.getModel(),
					oViewModel = this.getModel("viewModel"),
					sPath = this.getView()
					.byId("idTable")
					.getSelectedItem()
					.getBindingContext().sPath;

				oModel.remove(sPath);
				this.getView().byId("idTable").removeSelections();
				oViewModel.setProperty("/DeleteEnabled", true);
				this.getModel().refresh(true);
			},
			_stockControl: async function() {
				let oViewModel = this.getModel("viewModel"),
					oCharg = oViewModel.getProperty("/Charg"),
					oLgnum = oViewModel.getProperty("/Lgnum"),
					oKlgort = oViewModel.getProperty("/Klgort"),
					oMatnr = oViewModel.getProperty("/Matnr"),
					oOwner = oViewModel.getProperty("/Owner");

				let fnSuccess = (oData) => {
						if (oData.EvQuan) {
							oViewModel.setProperty("/StockInfo", parseFloat(oData.EvQuan));
							oViewModel.setProperty("/Unit", oData.EvUnit);
						} else {
							if (oData.Message) {
								sap.m.MessageBox.error(oData.Message);
							}
						}
					},
					fnError = (err) => {
						let errorObj1 = JSON.parse(err.responseText);
						sap.m.MessageBox.error(errorObj1.error.message.value);
					},
					fnFinally = () => {
						sap.ui.core.BusyIndicator.hide();
						oViewModel.setProperty("/busy", false);
					};
				await this._checkStock(oCharg, oLgnum, oKlgort, oMatnr, oOwner)
					.then(fnSuccess)
					.catch(fnError)
					.finally(fnFinally);

			},
			_checkStock: async function(oCharg, oLgnum, oKlgort, oMatnr, oOwner) {

				let oModel = this.getModel();

				return new Promise((fnResolve, fnReject) => {
					let oParams = {
							success: fnResolve,
							error: fnReject,
						},
						sPath = oModel.createKey("/StockControlSet", {
							IvCharg: oCharg,
							IvLgnum: oLgnum,
							IvLgpla: oKlgort,
							IvMatnr: oMatnr,
							IvOwner: oOwner

						});
					oModel.read(sPath, oParams);
				});
			}
		});
	}
>>>>>>> cd1949f (Miktar Değişiklikleri)
);