const BarChart = require("./charts/bar.js");
const PriceChart = require("./charts/price-history.js");
const ScatterPlot = require("./charts/scatter.js");
const RankingCharts = require("./charts/rankings.js");
const Rankings = require("./rankings.js");
const fs = require("fs").promises;
const convert = require('convert-units');

/************************************************
 * Entry Point
 ***********************************************/

function generate(product, products) {
    const weightChart = RankingCharts.generateWeight(
        product,
        Rankings.fetchMensByWeightAsc(products)
    );
    console.log(weightChart);

    //return generateHTML(product) + generateJS(product);

    /*
    const rankings = (product.gender === 'male') ?
        Rankings.computeRankingsOspreyMens(product.sku, products) :
        Rankings.computeRankingsOspreyWomens(product.sku, products);
    console.log(rankings);
    */
}

/************************************************
 * Madlibs
 ***********************************************/

// Cost / Liter
const CPL_BUDGET = 0;
const CPL_MIDRANGE = 3.5;
const CPL_PREMIUM = 5.25;

// "The Osprey Women's Aura AG 50 Pack is a premium backpacking pack that comes in three sizes (XS, S, M), while the Gregory Men's Baltoro 65 Pack is a midrange backpacking pack that comes in three sizes (S, M, L)."
function madlibsIntro(product) {
    var numVariants = "one size";
    if (product.sizes.data.length === 2) {
        numVariants = `two sizes (${product.sizes.data.join(", ")})`;
    }
    if (product.sizes.data.length === 3) {
        numVariants = `three sizes (${product.sizes.data.join(", ")})`;
    }

    var segment = "midrange";
    if (product.volume.data.length !== 0) {
        const cpl = product.price / product.volume.data[0].val;
        if (cpl < CPL_MIDRANGE)  segment = "budget";
        if (cpl > CPL_PREMIUM)   segment = "premium";
    }

    const bestUsedFor = (product.best_used_for == 'Hiking') ? "hiking" : "backpacking";
    return `${product.name} is a ${segment} ${bestUsedFor} backpack that comes in ${numVariants}`;
}


/**
 * "See the weight breakdodwn for the Osprey Women's Aura AG 50 Pack."
 * The Osprey Women's Aura AG 50 Pack weighs 3 lbs (4.5 kg)."
 */
function madlibsWeight(p1) {
    var madlib = `<p>See the weight breakdown for the ${p1.name}.</p>`;
    const w1_lbs = convert(p1.weight.data[0].val).from('oz').to('lb');
    const w1_kg = convert(p1.weight.data[0].val).from('oz').to('kg');
    return madlib + `<p>The ${p1.name} weighs ${w1_lbs} lbs (${w1_kg} kg).</p>`;
}

/**
 * "See the volume breakdown for the Osprey Women's Aura AG 50 Pack.
 * The Osprey Women's Aura AG 50 Pack holds 4 liters."
 */
function madlibsVolume(p1) {
    var madlib = `<p>See the volume breakdown for the ${p1.name}.</p>`;

    const v1_l = p1.volume.data[0].val;
    return `<p>The ${p1.name} holds ${v1_l} liters.</p>`;
}

function madlibsPriceTable(p1) {
    const price1 = parseFloat(p1.price);
    return `<p>At the time of publishing, the ${p1.name} retails for ${price1}.</p><p>See the latest deals at top retailers:</p>`;
}

/************************************************
 * Rankings
 ***********************************************/




/************************************************
 * HTML
 ***********************************************/

function generateHTML(p1) {
    return `
    <div class="affiliate-link-disclosure">
        Just so you know, this page contains affiliate links. This means if you make a purchase after clicking through one, at no extra cost to you we may earn a commission.
    </div>

    <!-- Specs Table -->
    <p>The ${madlibsIntro(p1)}.</p>
    <div class="specs-table-wrapper">
        <table class="specs-table">
            <colgroup>
                <col>
                <col>
            </colgroup>
            <thead>
                <tr>
                    <th></th>
                    <th><a href="${p1.buy_link}&ctc=geartool"><img src="${p1.image}?size=1000"></a></th>
                </tr>
                <tr>
                    <th></th>
                    <th><a href="${p1.buy_link}&ctc=geartool">${p1.name}</a></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>MSRP</td>
                    <td>$${p1.price}</td>
                </tr>
                <tr>
                    <td>Shop Online</td>
                    <td>
                        <a class="specs-table-link" href="${p1.buy_link}&ctc=geartool">$${p1.price} at REI</a>
                    </td>
                </tr>
                <tr>
                    <td>Best Used For</td>
                    <td>${p1.best_used_for}</td>
                </tr>

                <!-- Variant Specs -->
                <tr>
                    <td>Weight</td>
                    <td>
                        ${formatVariantFields(p1.weight.data)}
                    </td>
                </tr>
                <tr>
                    <td>Volume</td>
                    <td>
                        ${formatVariantFields(p1.volume.data)}
                    </td>
                </tr>

                <!-- Full-Text -->
                <tr>
                    <td>Gender</td>
                    <td>${(p1.gender === "female") ? "Women's" : "Men's"}</td>
                </tr>
                <tr>
                    <td>Fit - Waist</td>
                    <td>${p1.fit_waist_in}</td>
                </tr>
                <tr>
                    <td>Dimensions</td>
                    <td>${p1.dimensions}</td>
                </tr>
                <tr>
                    <td>Sizes</td>
                    <td>${p1.sizes.raw}</td>
                </tr>
                <tr>
                    <td>Colors</td>
                    <td>${p1.colors.raw}</td>
                </tr>
                <tr>
                    <td>Materials</td>
                    <td>${p1.materials}</td>
                </tr>
                <tr>
                    <td>Description</td>
                    <td>${p1.long_description}</td>
                </tr>
            </tbody>
        </table>
    </div>

    [toc]

    <!-- Weight -->
    <h2>Weight</h2>
    ${madlibsWeight(p1)}
    <div class="chart-container">
        <canvas id="weight-bar-chart"></canvas>
    </div>

    <h2>Price vs. Weight</h2>
    <p>Compare the price-to-weight ratio of the ${p1.name} to all the other backpacking backpacks in our database.</p>
    <div class="scatter-container">
        <canvas id="scatter-price-weight-chart"></canvas>
    </div>

    <!-- Volume -->
    <h2>Volume</h2>
    ${madlibsVolume(p1)}
    <div class="chart-container">
        <canvas id="volume-bar-chart"></canvas>
    </div>

    <h2>Price vs. Volume</h2>
    <p>Compare the price-to-volume ratio of the ${p1.name} to all the other backpacking backpacks in our database.</p>
    <div class="scatter-container">
        <canvas id="scatter-price-volume-chart"></canvas>
    </div>

    <h2>Load Range</h2>
    <p>Compare how many pounds of gear each pack can comfortably carry.</p>
    <div class="chart-container">
        <canvas id="load-range-chart"></canvas>
    </div>

    <!-- Purchase Table -->
    <h2>Where to Buy</h2>
    ${madlibsPriceTable(p1)}
    <div class="specs-table-wrapper">
        <table class="specs-table">
            <colgroup>
                <col>
                <col>
            </colgroup>
            <thead>
                <tr>
                    <th></th>
                    <th></th>
                </tr>
                <tr>
                    <th></th>
                    <th><a href="${p1.buy_link}&ctc=geartool">${p1.name}</a></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>REI</td>
                    <td>
                        <a class="specs-table-link" href="${p1.buy_link}&ctc=geartool">$${p1.price}</a>
                    </td>
                </tr>
                ${insertBuyInfoBC(p1)}
                ${insertBuyInfoOsprey(p1)}

            </tbody>
        </table>
    </div>

    <!-- Price Charts -->
    <h2>Price History</h2>
    <p>Click on a retailer’s name to add or remove it from the chart.</p>
    <div>
        <div id="price1" class="price-chart-container">
            <canvas id="price-history-chart-p1"></canvas>
        </div>
    </div>
`;
}

function insertBuyInfoBC(p1) {
    if (!p1.purchase_info.backcountry) {
        return '';
    }

    const td1 = (!p1.purchase_info.backcountry) ?
        `<td></td>` :
        `<td>
            <a class="specs-table-link" href="${p1.purchase_info.backcountry.buy_link}&ctc=geartool">$${p1.purchase_info.backcountry.retail_price}</a>
        </td>`;

    return `
    <tr>
        <td>Backcountry</td>
        ${td1}
    </tr>`;
}

function insertBuyInfoOsprey(p1) {
    if (!p1.purchase_info.osprey) {
        return '';
    }

    const td1 = (!p1.purchase_info.osprey) ?
        `<td></td>` :
        `<td>
            <a class="specs-table-link" href="${p1.purchase_info.osprey.buy_link}&ctc=geartool">$${p1.purchase_info.osprey.retail_price}</a>
        </td>`;

    return `
    <tr>
        <td>Osprey</td>
        ${td1}
    </tr>`;
}

function formatVariantFields(val) {
    var out = '';
    for (const element of val) {
        out += `<b>${element.key}</b>: ${element.raw}<br>`;
    }
    return out.slice(0, -4);
}

/************************************************
 * Javascript
 ***********************************************/

function generateJS(p1) {
    return `
    <script type="text/javascript">
    <!--` +
        BarChart.generateChart(
            "volume-bar-chart", "Volume", "L",
            p1.name, p1.volume.data,
        ) +
        BarChart.generateChart(
            "weight-bar-chart", "Weight", "oz",
            p1.name, p1.weight.data,
        ) +
        generateLoadChartJS(p1) +
        PriceChart.generateChart(p1) +
        ScatterPlot.generatePriceVsWeight(p1) +
        ScatterPlot.generatePriceVsVolume(p1) + `
    //--></script>`;
}

function generateLoadChartJS(p1) {
    const label1 = `${Math.round(p1.load.low)}-${Math.round(p1.load.high)} lbs.`;

    return `
new Chart(
    document.getElementById('load-range-chart').getContext("2d"),
    {
        type: 'horizontalBar',
        data: {
            datasets: [
                {
                    label: "${p1.name}",
                    data: [[ ${p1.load.low}, ${p1.load.high}]],
                    backgroundColor: '#7AADE1',
                    barPercentage: 0.9,
                },
            ],
        },
        plugins: [{
            beforeLayout: function(context) {
                var fontSize = (context.chart.width < 900) ? 10 : 16;
                context.chart.options.plugins.datalabels.font.size = fontSize;
                context.chart.options.legend.labels.fontSize = fontSize;
            }
        }],
        options: {
            title: false,
            responsive: true,
            maintainAspectRatio: false,
            tooltips: false,
            legend: {
                display: false,
            },
            plugins: {
                datalabels: {
                    color: '#EDEDED',
                    formatter: function(value, context) {
                        var i = context.dataIndex;
                        var j = context.datasetIndex;
                        if (i == 0 && j == 0) return "${label1}";
                    }
                }
            }
        },
    }
);`;
}

module.exports = {
    generate
};
