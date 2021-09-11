import { API_SERVER } from "../common";

export async function handleCron(event: ScheduledEvent): Promise<Response> {
    const currentBlock = await getCurrentBlock()

    return new Response()
}

async function getCurrentBlock(): Promise<Number> {
    let url = `${API_SERVER}/extended/v1/block?limit=1`;
    const response = await fetch(url);
    let result = await response.json();
    return result.results[0].height;
}