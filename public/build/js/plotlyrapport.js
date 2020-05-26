          
                        j=0;
                        data = [{
                            values: PH_consomation,
                            labels: ['jour','pointe ete','soir','nuit'],
                            domain: {column: 0},
                            name: 'Consommation',
                            hoverinfo: 'label+percent+name',
                            hole: .4,
                            type: 'pie'
                        }];

                        layout = {
                            title: 'Consommation',
                            showlegend: false,
                            annotations: [
                                {
                                    font: {
                                        size: 14
                                    },
                                    showarrow: false,
                                    text: ' ',

                                }
                            ]
                        };
                        Plotly.newPlot('rp_cm', data, layout, {responsive: true});
                        //*********************************************************
                        data = [];
                        layout = {};
                        //*********************Consomation timeseries**************
                        trace1 = {
                            type: "scatter",
                            mode: "lines",
                            name: 'Consommation',
                            x: consomation[0],
                            y: consomation[1],
                            line: {color: '#17BECF'}
                        };
                        data.push(trace1);
                        layout = {
                            title: 'Time series',
                            xaxis: {
                                autorange: true,
                                range: [consomation[0][0], consomation[0][consomation[0].length - 1]],
                                rangeselector: {
                                    buttons: [
                                        {
                                            count: 1,
                                            label: '1m',
                                            step: 'month',
                                            stepmode: 'backward'
                                        },
                                        {
                                            count: 6,
                                            label: '6m',
                                            step: 'month',
                                            stepmode: 'backward'
                                        },
                                        {step: 'all'}
                                    ]
                                },
                                rangeslider: {range: [consomation[0][0], consomation[0][consomation[0].length - 1]]},
                                type: 'date'
                            },
                        };
                        Plotly.newPlot('vh_cm', data, layout, {responsive: true});
                        //*********************************************************
                        data = [];
                        layout = {};
                        //*********************Consomation Histogram**************
                        trace1 = {
                            x: consomation[1],
                            name: 'consommation',
                            autobinx: true,
                            histnorm: "count",
                            marker: {
                                color: "rgba(255, 100, 102, 0.7)",
                                line: {
                                    color: "rgba(255, 100, 102, 1)",
                                    width: 0.01
                                }
                            },
                            opacity: 0.5,
                            type: "histogram",
                        };
                        data = [trace1];
                        layout = {
                            bargap: 0.05,
                            bargroupgap: 0.2,
                            barmode: "overlay",
                            title: "Consommation",
                            xaxis: {title: "puissance"},
                            yaxis: {title: " "}
                        };
                        Plotly.newPlot('hm_cm', data, layout, {responsive: true});
                        //*********************************************************
                        data = [];
                        layout = {};
                        //*********************Consomation Heatmap**************
                        data = [{
                            z: consomation_heatmap1Tot[j],
                            colorscale: 'Electric',
                            type: 'heatmap'
                        }];
                        Plotly.newPlot('heat_cm', data, {yflip: true}, {responsive: true},);
                        //***********************tableau Répartition des différents paramètres par poste horaire
                        for (let i = 0; i < PH_consomation.length; i++) {
                            $('#t_charge').append(
                                "<td>" + round(PH_consomation[i], 0) + "</td>"
                            );
                            $('#t_transportee').append(
                                "<td>" + round(PH_auto_consome[i], 0) + "</td>"
                            );

                            $('#t_prod').append(
                                "<td>" + round(PH_production[i], 0) + "</td>"
                            );
                            $('#t_cedee').append(
                                "<td>" + round(PH_cedee[i], 0) + "</td>"
                            );
                            $('#t_imp').append(
                                "<td>" + round(PH_importer[i], 0) + "</td>"
                            );
                        }
                        $('#t_charge').append(
                            "<td>" + round(PH_consomation.reduce(reducer), 0) + "</td>"
                        );
                        $('#t_transportee').append(
                            "<td>" + round(PH_auto_consome.reduce(reducer), 0) + "</td>"
                        );
                        $('#t_prod').append(
                            "<td>" + round(PH_production.reduce(reducer), 0) + "</td>"
                        );
                        $('#t_cedee').append(
                            "<td>" + round(PH_cedee.reduce(reducer), 0) + "</td>"
                        );
                        $('#t_imp').append(
                            "<td>" + round(PH_importer.reduce(reducer), 0) + "</td>"
                        );
                        //************************************************************************
                        data = [{
                            values: [PH_auto_consome.reduce(reducer),PH_importer.reduce(reducer)],
                            labels: ['Auto-consommee', 'importee'],
                            domain: {column: 0},
                            name: 'Auto-consommee , E-importee',
                            hoverinfo: 'label+percent+name',
                            hole: .4,
                            type: 'pie'
                        }];

                        layout = {
                            title: 'Auto-consommee , E-importee',
                            showlegend: false,
                            annotations: [
                                {
                                    font: {
                                        size: 14
                                    },
                                    showarrow: false,
                                    text: ' ',

                                }
                            ]
                        };
                        Plotly.newPlot('auto_cm_imp', data, layout, {responsive: true});
                        //**************************************repartion energy produite**********************
                        trace1 = {
                            x: ['Jour','Ete','Soir','Nuit'],
                            y: PH_autoconsomer_ps,
                            name: 'Production',
                            type: 'bar'
                        };

                        trace2 = {
                            x: ['Jour','Ete','Soir','Nuit'],
                            y: PH_cedee_ps,
                            name: 'Auto-consommee',
                            type: 'bar'
                        };

                        data = [trace1, trace2];

                        layout = {barmode: 'stack'};

                        Plotly.newPlot('rp_pd', data, layout,{responsive: true});

                        //***********************prod/consomer********************
                        data = [{
                            values: [cedee[1].reduce(reducer)/production[1].reduce(reducer),auto_consomeTot[1].reduce(reducer)/production[1].reduce(reducer)],
                            labels: ['cedee','auto-consommee'],
                            domain: {column: 0},
                            hoverinfo: 'label+percent+name',
                            hole: .4,
                            type: 'pie'
                        }];

                        layout = {
                            showlegend: true,
                            annotations: [
                                {
                                    font: {
                                        size: 14
                                    },
                                    showarrow: false,
                                    text: ' ',

                                }
                            ]
                        };
                        Plotly.newPlot('pd_cm', data, layout, {responsive: true});
                        //*********************************************************
                       
                        
                        data=[];
                        trace1 = {
                            type: "scatter",
                            mode: "lines",
                            name: 'Consommation',
                            x: consomation[0],
                            y: consomation[1],
                            line: {color: '#17BECF'}
                        };
                        data.push(trace1);
                        trace2 = {
                            type: "scatter",
                            mode: "lines",
                            name: 'Production',
                            x: production[0],
                            y: production[1],
                            line: {color: '#FFC300'}
                        };
                        data.push(trace2);

                        layout = {
                            title: 'Time series',
                            xaxis: {
                                autorange: true,
                                range: [consomation[0][0], consomation[0][consomation[0].length-1]],
                                rangeselector: {buttons: [
                                        {
                                            count: 1,
                                            label: '1h',
                                            step: 'hour',
                                            stepmode: 'backward'
                                        },
                                        {
                                            count: 6,
                                            label: '6m',
                                            step: 'month',
                                            stepmode: 'backward'
                                        },
                                        {step: 'all'}
                                    ]},
                                rangeslider: {range: [consomation[0][0], consomation[0][consomation[0].length-1]]},
                                type: 'date'
                            },
                        };
                        Plotly.newPlot('timeseries_pd_cm', data, layout,{responsive: true});
                        //********************************************************************
                        data=[];
                        layout={};

                        trace1 = {
                            x: ["January","February","March","April","May","June","July","August","September","October","November","December"],
                            y: month_auto,
                            name: 'Transportee',
                            type: 'bar'
                        };

                        trace2 = {
                            x: ["January","February","March","April","May","June","July","August","September","October","November","December"],
                            y: month_imp,
                            name: 'Importee',
                            type: 'bar'
                        };

                        data = [trace1, trace2];

                        layout = {barmode: 'stack'};

                        Plotly.newPlot('rp_m_cm', data, layout,{responsive: true});
                        //***********************************************************************

                        trace1 = {
                            y: cashflow,
                            name: 'Cash Flow',
                            type: 'bar'
                        };

                        trace2 = {
                            type: "scatter",
                            mode: "lines",
                            name: 'Cash Flow Cumles',
                            y: cashflow_cum,

                            line: {color: '#17BECF'}
                        };

                        data = [trace1, trace2];

                        layout = {barmode: 'stack'};

                        Plotly.newPlot('chat_cashflow', data, layout,{responsive: true});
                        //*********************************************************

                        trace1 = {
                            y: annuite,
                            name: 'Annuite',
                            type: 'bar'
                        };

                        trace2 = {
                            type: "scatter",
                            mode: "lines",
                            name: 'DSCR',
                            y: dsacr,
                            yaxis: 'y2',
                            line: {color: '#17BECF'}
                        };
                        trace3 = {
                            y: cfadstmp,
                            name: 'CFADS',
                            type: 'bar'
                        };

                        data = [trace1, trace2,trace3];

                        layout = {
                            barmode: 'group',
                            yaxis2: {
                                overlaying: 'y',
                                side: 'right'
                            },
                            rangeslider: {range: [cfadstmp[0], cfadstmp[cfadstmp.length-1]]},
                        };

                        Plotly.newPlot('final_chart', data, layout,{responsive: true});
                        