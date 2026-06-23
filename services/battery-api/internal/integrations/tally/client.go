package tally

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client speaks to Tally Prime via its HTTP XML API.
type Client struct {
	baseURL string
	client  *http.Client
}

// NewClient creates a Tally HTTP XML client.
func NewClient(host string, port int) *Client {
	return &Client{
		baseURL: fmt.Sprintf("http://%s:%d", host, port),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// TallyStockItem is a single stock item from Tally.
type TallyStockItem struct {
	Name        string  `xml:"NAME"`
	Parent      string  `xml:"PARENT"`
	BaseUnits   string  `xml:"BASEUNITS"`
	OpeningQty  float64 `xml:"OPENINGBALANCE"`
	ClosingQty  float64 `xml:"CLOSINGBALANCE"`
	ClosingRate float64 `xml:"CLOSINGRATE"`
	ClosingAmt  float64 `xml:"CLOSINGVALUE"`
}

// TallyVoucher represents a purchase voucher from Tally.
type TallyVoucher struct {
	VoucherType string  `xml:"VOUCHERTYPENAME"`
	Date        string  `xml:"DATE"`
	PartyName   string  `xml:"PARTYLEDGERNAME"`
	Amount      float64 `xml:"AMOUNT"`
	Items       []struct {
		StockItem string  `xml:"STOCKITEMNAME"`
		Quantity  float64 `xml:"ACTUALQTY"`
		Rate      float64 `xml:"RATE"`
		Amount    float64 `xml:"AMOUNT"`
	} `xml:"INVENTORYENTRIES.LIST"`
}

// RequestStockItems fetches all stock items from Tally.
func (c *Client) RequestStockItems() ([]TallyStockItem, error) {
	reqXML := `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of StockItems</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of StockItems">
            <TYPE>StockItem</TYPE>
            <FETCH>Name, Parent, BaseUnits, OpeningBalance, ClosingBalance, ClosingRate, ClosingValue</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`

	resp, err := c.postXML(reqXML)
	if err != nil {
		return nil, fmt.Errorf("tally stock items request failed: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read tally response: %w", err)
	}

	// Tally wraps collections in a <DATA> → <COLLECTION> → <STOCKITEM> structure
	var envelope struct {
		XMLName xml.Name `xml:"ENVELOPE"`
		Body    struct {
			Data struct {
				Collection struct {
					StockItems []struct {
						Name        string  `xml:"NAME"`
						Parent      string  `xml:"PARENT"`
						BaseUnits   string  `xml:"BASEUNITS"`
						OpeningQty  float64 `xml:"OPENINGBALANCE"`
						ClosingQty  float64 `xml:"CLOSINGBALANCE"`
						ClosingRate float64 `xml:"CLOSINGRATE"`
						ClosingAmt  float64 `xml:"CLOSINGVALUE"`
					} `xml:"STOCKITEM"`
				} `xml:"COLLECTION"`
			} `xml:"DATA"`
		} `xml:"BODY"`
	}
	if err := xml.Unmarshal(data, &envelope); err != nil {
		return nil, fmt.Errorf("failed to parse tally stock items: %w", err)
	}

	var items []TallyStockItem
	for _, si := range envelope.Body.Data.Collection.StockItems {
		items = append(items, TallyStockItem{
			Name:        si.Name,
			Parent:      si.Parent,
			BaseUnits:   si.BaseUnits,
			OpeningQty:  si.OpeningQty,
			ClosingQty:  si.ClosingQty,
			ClosingRate: si.ClosingRate,
			ClosingAmt:  si.ClosingAmt,
		})
	}
	return items, nil
}

// RequestPurchaseVouchers fetches purchase vouchers from Tally.
func (c *Client) RequestPurchaseVouchers() ([]TallyVoucher, error) {
	reqXML := `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Purchase Vouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Purchase Vouchers">
            <TYPE>Voucher</TYPE>
            <FETCH>*, InventoryEntries.*, LedgerEntries.*</FETCH>
            <FILTER>IsPurchaseVch</FILTER>
          </COLLECTION>
          <SYSTEM TYPE="Formulae" NAME="IsPurchaseVch">:$VoucherTypeName = "Purchase"</SYSTEM>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`

	resp, err := c.postXML(reqXML)
	if err != nil {
		return nil, fmt.Errorf("tally purchase vouchers request failed: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read tally response: %w", err)
	}

	var envelope struct {
		XMLName xml.Name `xml:"ENVELOPE"`
		Body    struct {
			Data struct {
				Collection struct {
					Vouchers []struct {
						VoucherType string `xml:"VOUCHERTYPENAME"`
						Date        string `xml:"DATE"`
						PartyName   string `xml:"PARTYLEDGERNAME"`
						Amount      float64 `xml:"AMOUNT"`
						Inventory   []struct {
							StockItem string  `xml:"STOCKITEMNAME"`
							Quantity  float64 `xml:"ACTUALQTY"`
							Rate      float64 `xml:"RATE"`
							Amount    float64 `xml:"AMOUNT"`
						} `xml:"INVENTORYENTRIES.LIST"`
					} `xml:"VOUCHER"`
				} `xml:"COLLECTION"`
			} `xml:"DATA"`
		} `xml:"BODY"`
	}
	if err := xml.Unmarshal(data, &envelope); err != nil {
		return nil, fmt.Errorf("failed to parse tally vouchers: %w", err)
	}

	var vouchers []TallyVoucher
	for _, v := range envelope.Body.Data.Collection.Vouchers {
		vouchers = append(vouchers, TallyVoucher{
			VoucherType: v.VoucherType,
			Date:        v.Date,
			PartyName:   v.PartyName,
			Amount:      v.Amount,
		})
	}
	return vouchers, nil
}

func (c *Client) postXML(body string) (*http.Response, error) {
	req, err := http.NewRequest(http.MethodPost, c.baseURL, bytes.NewBufferString(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "text/xml")
	return c.client.Do(req)
}
