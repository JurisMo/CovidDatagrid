import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { AgChartsReact } from "ag-charts-react";
import "./InputData.css";

const InputData = () => {
  const [toggleState, setToggleState] = useState(1);
  const toggleTab = (index) => {
    setToggleState(index);
  };

  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("https://opendata.ecdc.europa.eu/covid19/casedistribution/json/")
      .then((resp) => resp.json())
      .then((data) => {
        setData(data.records);
      });
  }, []);

  const initialvalues = {
    fromDate: new Date("2019/12/31"),
    toDate: new Date("2020/12/14"),
  };

  const [isDisabled, setIsDisabled] = useState(true);
  const [isHidden, setIsHidden] = useState(true);
  const gridRef = useRef();
  const [vars, setVars] = useState("");
  const [startEnd, setStartEnd] = useState(initialvalues);

  const gridStyle = { height: "100%", width: "97%" };
  function modDataForGrid() {
    const totCases = data.reduce((prev, { countriesAndTerritories, cases }) => {
      prev[countriesAndTerritories] = prev[countriesAndTerritories]
        ? prev[countriesAndTerritories] + cases
        : cases;
      return prev;
    }, {});
    const totDeaths = data.reduce(
      (prev, { countriesAndTerritories, deaths }) => {
        prev[countriesAndTerritories] = prev[countriesAndTerritories]
          ? prev[countriesAndTerritories] + deaths
          : deaths;
        return prev;
      },
      {}
    );
    const obj3 = [];
    for (var prop in totCases) {
      obj3.push({
        countries: prop,
        totalCases: totCases[prop],
        totalDeaths: totDeaths[prop],
      });
    }

    const dataAdded = data.map((obj) => {
      const totalCases1 = obj3.find(
        (countriesAndTerritories) =>
          countriesAndTerritories.countries === obj.countriesAndTerritories
      );
      return {
        ...obj,
        totalCases: totalCases1.totalCases,
        totalDeaths: totalCases1.totalDeaths,
      };
    });
    return dataAdded;
  }

  const [columnDefs] = useState([
    {
      field: "countriesAndTerritories",
      headerName: "Valsts",
      resizable: false,
      headerClass: ["valstsKlase"],
      cellClass: ["valstsKlase"],
    },
    {
      field: "cases",
      headerName: "Gadījumu skaits",
      chartDataType: "number",
      resizable: false,
    },
    {
      field: "deaths",
      headerName: "Nāves gadījumi",
      chartDataType: "number",
      resizable: false,
    },
    {
      field: "totalCases",
      headerName: "Gadījumu skaits kopā",
      resizable: false,
    },
    {
      field: "totalDeaths",
      headerName: "Nāves gadījumi kopā",
      resizable: false,
    },
    {
      colId: "covid19Cases",
      field: `Cumulative_number_for_14_days_of_COVID-19_cases_per_100000`,
      headerName: "Gadījumu skaits uz 1000 iedzīvotājiem",
      valueGetter: (params) => {
        return +params.data[
          `Cumulative_number_for_14_days_of_COVID-19_cases_per_100000`
        ];
      },
      cellDataType: "number",
      resizable: false,
    },
    {
      field: `Cumulative_number_for_14_days_of_COVID-19_cases_per_100000`,
      valueGetter: (params) => {
        return +params.data[
          `Cumulative_number_for_14_days_of_COVID-19_cases_per_100000`
        ];
      },
      headerName: "Nāves Gadījumu skaits uz 1000 iedzīvotājiem",
      cellDataType: "number",
      resizable: false,
    },
    {
      field: "dateRep",
      chartDataType: "category",
      headerName: "datums",
      filter: "agDateColumnFilter",
      filterParams: {
        minValidDate: "2019-12-31",
        maxValidDate: "2020-12-14",
        comparator: (dateFromFilter, cellValue) => {
          const dateParts = cellValue.split("/");
          const day = Number(dateParts[0]);
          const month = Number(dateParts[1]) - 1;
          const year = Number(dateParts[2]);
          const cellDate = new Date(year, month, day);
          if (cellDate < dateFromFilter) {
            return -1;
          } else if (cellDate > dateFromFilter) {
            return 1;
          }
          return 0;
        },
      },
      hide: true,
    },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      editable: false,
      filter: true,
      flex: 1,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      wrapText: true,
      autoHeight: true,
    };
  }, []);
  function chartSum() {
    const holderC = {};
    const holderD = {};

    data.forEach(function (d) {
      if (
        Object(d.countriesAndTerritories.toUpperCase()).includes(
          vars.toUpperCase()
        )
      ) {
        holderC.hasOwnProperty(d.dateRep)
          ? (holderC[d.dateRep] = holderC[d.dateRep] + d.cases)
          : (holderC[d.dateRep] = d.cases); //{
        //   holderC[d.dateRep] = holderC[d.dateRep] + d.cases;
        // } else {
        //   holderC[d.dateRep] = d.cases;
        // }
      }
    });
    data.forEach(function (d) {
      if (
        Object(d.countriesAndTerritories.toUpperCase()).includes(
          vars.toUpperCase()
        )
      ) {
        if (holderD.hasOwnProperty(d.dateRep)) {
          holderD[d.dateRep] = holderD[d.dateRep] + d.deaths;
        } else {
          holderD[d.dateRep] = d.deaths;
        }
      }
    });

    const obj2 = [];
    for (var prop in holderC) {
      obj2.push({ dateRep: prop, cases: holderC[prop], deaths: holderD[prop] });
    }
    const obj11 = obj2.map((obj) => {
      const dateParts = obj.dateRep.split("/");
      const day = Number(dateParts[0]);
      const month = Number(dateParts[1]) - 1;
      const year = Number(dateParts[2]);
      const dateee = new Date(year, month, day).getTime();

      return { dateRep: dateee, cases: obj.cases, deaths: obj.deaths };
    });

    const aaaa = obj11.filter((obj) => {
      return obj.dateRep > startEnd.fromDate && obj.dateRep < startEnd.toDate;
    });
    aaaa.sort((a, b) => a.dateRep - b.dateRep);
    return aaaa;
  }
  const onFilterAfterCountryChange = useCallback(() => {
    const filterInstanceCountry = gridRef.current.api.getFilterInstance(
      "countriesAndTerritories"
    );
    filterInstanceCountry.setModel({
      filterType: "text",
      type: "contains",
      filter: document.getElementById("filter-country").value,
    });
    setVars(document.getElementById("filter-country").value);
    gridRef.current.api.onFilterChanged();
  }, []);

  const onFilterDateChange = useCallback(() => {
    const filterInstanceDate = gridRef.current.api.getFilterInstance("dateRep");
    filterInstanceDate.setModel({
      filterType: "date",
      type: "inRange",
      dateFrom: document.getElementById("date-from").value,
      dateTo: document.getElementById("date-to").value,
    });
    setStartEnd({
      fromDate: new Date(document.getElementById("date-from").value).getTime(),
      toDate: new Date(document.getElementById("date-to").value).getTime(),
    });
    gridRef.current.api.onFilterChanged();
  }, []);

  const onFilterAfterFieldChange = useCallback(() => {
    setIsDisabled(false);
    setIsHidden(true);
    const filterInstance = gridRef.current.api.getFilterInstance(
      document.getElementById("filter-after-field").value
    );
    filterInstance.setModel({
      filterType: "number",
      type: "inRange",
      filter: document.getElementById("filter-text-box-from").value,
      filterTo: document.getElementById("filter-text-box-to").value,
    });
    gridRef.current.api.onFilterChanged();
  }, []);

  const resetFilerModel = () => {
    gridRef.current.api.setFilterModel(null);
    document.getElementById("filter-country").value = "";
    document.getElementById("filter-text-box-from").value = "";
    document.getElementById("filter-text-box-to").value = "";
    document.getElementById("filter-after-field").selectedIndex = "0";
    setVars("");
    setIsHidden(false);
    setIsDisabled(true);
  };
  const onGridReady = () => {
    setData(modDataForGrid());
  };

  return (
    <div className="container">
      periods no{" "}
      <input
        type="date"
        min="2019-12-31"
        max="2020-12-14"
        id="date-from"
        onInput={onFilterDateChange}
      />
      līdz{" "}
      <input
        type="date"
        min="2019-12-31"
        max="2020-12-14"
        id="date-to"
        onInput={onFilterDateChange}
      />
      <div className="bloc-tabs">
        <button
          id="tab"
          className={toggleState === 1 ? "tabs active-tabs" : "tabs"}
          onClick={() => {
            toggleTab(1);
          }}
        >
          TABULA
        </button>
        <button
          id="chorts"
          className={toggleState === 2 ? "tabs active-tabs" : "tabs"}
          onClick={() => {
            toggleTab(2);
          }}
        >
          GRAFIKS
        </button>
      </div>
      <div className="content-tabs">
        <div
          className={toggleState === 1 ? "content active-content" : "content"}
        >
          <div className="filterArea">
            <input
              type="text"
              id="filter-country"
              placeholder="Valsts meklēšana"
              onInput={onFilterAfterCountryChange}
              onChange={(e) => setVars(e.target.value)}
              className="filt-input"
            />
            <select
              id="filter-after-field"
              onChange={onFilterAfterFieldChange}
              required
            >
              <option hidden={isHidden} value="">
                Filtrēt pēc lauka:
              </option>
              <option value="cases">Gadījumu skaits</option>
              <option value="deaths">Nāves gadījumi</option>
              <option value="cases">Gadījumu skaits kopā</option>
              <option value="deaths">Nāves gadījumi kopā</option>
              <option value="Cumulative_number_for_14_days_of_COVID-19_cases_per_100000">
                Gadījumu skaits uz 1000 iedzīvotājiem
              </option>
              <option value="Cumulative_number_for_14_days_of_COVID-19_cases_per_100000">
                Nāves Gadījumu skaits uz 1000 iedzīvotājiem
              </option>
            </select>
            <input
              disabled={isDisabled}
              type="text"
              placeholder="No"
              id="filter-text-box-from"
              onInput={onFilterAfterFieldChange}
              className="filt-input"
            />
            <input
              disabled={isDisabled}
              type="text"
              id="filter-text-box-to"
              placeholder="Līdz"
              onInput={onFilterAfterFieldChange}
              className="filt-input"
            />
          </div>
          <button
            id="reset-id"
            className="filt-input"
            onClick={resetFilerModel}
            type="reset"
          >
            reset filter
          </button>
          <div style={gridStyle} className={"ag-theme-balham"}>
            <AgGridReact
              rowData={modDataForGrid()}
              columnDefs={columnDefs}
              resizable={false}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={3}
              paginationPageSizeSelector={[3, 5, 10, 100]}
              onGridReady={onGridReady}
              ref={gridRef}
            />
          </div>
        </div>
        <div
          className={toggleState === 2 ? "content active-content" : "content"}
        >
          <AgChartsReact
            options={{
              data: chartSum(),
              series: [
                {
                  type: "line",
                  xKey: "dateRep",
                  yKey: "cases",
                  marker: { enabled: false },
                },
                {
                  type: "line",
                  xKey: "dateRep",
                  yKey: "deaths",
                  marker: { enabled: false },
                },
              ],
              axes: [
                {
                  type: "time",
                  position: "bottom",
                },
                {
                  type: "number",
                  position: "left",
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InputData;
