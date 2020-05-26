years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
                nuit=[31, 32, 32, 38, 40, 42, 48, 61, 76, 76, 85, 85, 93, 100, 115, 115, 115, 122, 167, 188]
                jour=[49, 50, 50, 52, 59, 61, 66, 78, 96, 96, 110, 110, 123, 132, 152, 152, 152, 161, 215, 240]
                soir=[70, 72, 72, 77, 80, 90, 94, 108, 121, 121, 132, 132, 148, 152]
                pointe=[92, 93, 93, 98, 102, 108, 111, 131, 152, 152, 168, 168, 188, 198]
                psoir=[219, 219, 219, 227, 291, 329]
                pmatin=[239, 239, 239, 250, 323, 366]

                var trace11 = {
                    x: years,
                    y: nuit,
                    mode: 'lines',
                    name: 'Nuit'
                };

                var trace21 = {
                    x: years,
                    y: jour,
                    mode: 'lines',
                    name: 'Jour'
                };

                var trace31 = {
                    x: years,
                    y: soir,
                    mode: 'lines',
                    name: 'Soir'
                };

                var trace41 = {
                    x: years,
                    y: pointe,
                    mode: 'lines',
                    name: 'Pointe'
                };

                var trace51 = {
                    x: [2014, 2015, 2016, 2017, 2018, 2019],
                    y: psoir,
                    mode: 'lines',
                    name: 'P Soir'
                };

                var trace61 = {
                    x: [2014, 2015, 2016, 2017, 2018, 2019],
                    y: pmatin,
                    mode: 'lines',
                    name: 'P M été'
                };

                

                var data11 = [ trace11, trace21, trace31, trace41, trace51, trace61 ];

                var layout11 = {
                    title:'Evolution des tarifs hors taxes de l électricité en MT (STEG) Régime à postes horaires',
                    font: {
                            
                            size: 9
                        },
                    
                };

                var config = {responsive: true}

                Plotly.newPlot('tarif-horaire', data11, layout11, config);


                tarif=[64, 64, 65, 69, 73, 79, 84, 97, 115, 115, 125, 125, 137, 143, 167, 167, 167, 176, 212, 251]
                

                var trace101 = {
                    x: years,
                    y: tarif,
                    mode: 'lines',
                    name: 'Tarif'
                };

                var data101 = [ trace101];

                var layout101 = {
                    title:'Evolution des tarifs hors taxes de l électricité en MT (STEG) Régime Uniforme',
                    font: {
                        
                        size: 9
                    },
                
                };

                var config = {responsive: true}

                Plotly.newPlot('tarif-uniforme', data101, layout101, config);


                var data102 = [{
                    values: [20, 29, 21, 12 ,6 ,12],
                    labels: ['inf. 20kW ', '20-50kW ', '50-100kW', '100-150kW', '150-200kW','sup. 200kW'],
                    type: 'pie'
                }];

                var layout102 = {
                    title:'-'
                };

                var config = {responsive: true}


                Plotly.newPlot('rep-puissance', data102, layout102,config);
