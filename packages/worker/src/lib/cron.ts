import { MAINNET_SERVER } from "../constants";

export async function handleCron(event: ScheduledEvent) {
    const currentBlock = await getCurrentBlock()
    
}

async function getCurrentBlock(): Promise<any> {
    let url = `${MAINNET_SERVER}/extended/v1/block?limit=1`;
    const response = await fetch(url);
    let result = await response.json();
    return result.results[0].height;
}