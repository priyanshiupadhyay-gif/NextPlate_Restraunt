#!/usr/bin/env node

/**
 * NextPlate CLI — The Grid Registry
 * --------------------------------
 * A terminal interface for the NextPlate AI-Powered Food Redistribution Network.
 * Built for 'sudo make world' hackathon.
 */

const { Command } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const figlet = require('figlet');
const boxen = require('boxen');
const ora = require('ora');
const fs = require('fs');
const path = require('path');

const program = new Command();
const CONFIG_PATH = path.join(__dirname, '.nplate-config.json');

// --- Helper Functions ---
const loadConfig = () => {
    if (fs.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
    return { apiUrl: 'http://localhost:5000/api/v1' };
};

const saveConfig = (config) => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

const getClient = () => {
    const config = loadConfig();
    return axios.create({
        baseURL: config.apiUrl,
        timeout: 5000,
    });
};

const printBanner = () => {
    console.log(chalk.orange ? chalk.orange(figlet.textSync('NextPlate', { horizontalLayout: 'full' })) : chalk.yellow(figlet.textSync('NextPlate', { horizontalLayout: 'full' })));
    console.log(chalk.gray('The Zero-Waste Grid Registry Interface\n'));
};

const handleError = (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.log(chalk.red('\n[!] Connection Refused: Is the NextPlate backend running?'));
        console.log(chalk.gray('Default: http://localhost:5000/api\n'));
    } else {
        console.log(chalk.red(`\n[!] Error: ${err.message}`));
    }
    process.exit(1);
};

// --- CLI Commands ---

program
    .name('nplate')
    .description('CLI for NextPlate Food Security Grid')
    .version('1.0.0');

// 1. nplate status
program
    .command('status')
    .description('Check global grid health and impact stats')
    .action(async () => {
        printBanner();
        const spinner = ora('Synchronizing with Global Grid...').start();
        try {
            const client = getClient();
            const res = await client.get('/impact/stats');
            spinner.stop();

            const { totalMealsRescued, totalCO2Saved, totalMoneySaved, networkResilience } = res.data.data;

            console.log(boxen(
                `${chalk.bold.green('GLOBAL IMPACT METRICS')}\n\n` +
                `${chalk.cyan('Meals Rescued:')}   ${chalk.bold(totalMealsRescued)}\n` +
                `${chalk.green('Carbon Offset:')}   ${chalk.bold(totalCO2Saved)}\n` +
                `${chalk.yellow('Economic Yield:')}  ${chalk.bold(totalMoneySaved)}\n\n` +
                `${chalk.bold.magenta('NETWORK TOPOLOGY')}\n` +
                `${chalk.white('Active NGOs:')}      ${networkResilience.activeNGOs}\n` +
                `${chalk.white('Active Nodes:')}     ${networkResilience.participatingRestaurants}`,
                { padding: 1, margin: 1, borderStyle: 'double', borderColor: 'yellow' }
            ));
        } catch (err) {
            spinner.stop();
            handleError(err);
        }
    });

// 2. nplate grid (List available surplus)
program
    .command('grid')
    .description('List all active food packets available for rescue')
    .option('-z, --zone <city>', 'Filter by sector/city')
    .action(async (options) => {
        printBanner();
        const spinner = ora('Scanning local liquidation grid...').start();
        try {
            const client = getClient();
            const res = await client.get('/impact/donations');
            spinner.stop();

            const items = res.data.data;

            const table = new Table({
                head: [chalk.bold('ID'), chalk.bold('Item Name'), chalk.bold('Node'), chalk.bold('Qty'), chalk.bold('CO2e')],
                colWidths: [8, 30, 25, 6, 8]
            });

            items.forEach(item => {
                table.push([
                    item._id.substring(0, 6),
                    chalk.green(item.name),
                    item.restaurantId?.name || 'Unknown',
                    item.availableQuantity,
                    `${item.carbonScore || 0.8}kg`
                ]);
            });

            console.log(chalk.bold('\n[ ACTIVE GRID PACKETS ]'));
            console.log(table.toString());
            console.log(chalk.gray(`\nFound ${items.length} packets in the current liquidation cycle.\n`));
        } catch (err) {
            spinner.stop();
            handleError(err);
        }
    });

// 3. nplate history (Recent rescues)
program
    .command('history')
    .description('View recent grid activity and rescues')
    .action(async () => {
        printBanner();
        const spinner = ora('Retrieving grid activity logs...').start();
        try {
            const client = getClient();
            const res = await client.get('/impact/recent-rescues');
            spinner.stop();

            const table = new Table({
                head: [chalk.bold('Time'), chalk.bold('Action'), chalk.bold('Sector'), chalk.bold('Impact')],
                colWidths: [12, 40, 15, 10]
            });

            res.data.data.forEach(log => {
                table.push([
                    log.time,
                    `${chalk.cyan('RESCUE:')} ${log.item} from ${chalk.yellow(log.from)}`,
                    log.city || 'National',
                    chalk.green(`-${log.co2}kg`)
                ]);
            });

            console.log(chalk.bold('\n[ RECENT GRID ACTIVITY ]'));
            console.log(table.toString());
            console.log('\n');
        } catch (err) {
            spinner.stop();
            handleError(err);
        }
    });

// 4. nplate config (Set API URL)
program
    .command('init')
    .description('Initialize or update the grid registry connection')
    .argument('<url>', 'The API Base URL (e.g., http://localhost:5000/api)')
    .action((url) => {
        const config = { apiUrl: url };
        saveConfig(config);
        console.log(chalk.green(`\n[✓] Registry Synced. Targeting: ${url}\n`));
    });

program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
