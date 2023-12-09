/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { ApiProvider, ProviderEmbeddingResponse, ProviderResponse } from 'promptfoo';
import { openSearchClient } from './clients/opensearch';
import { PROVIDERS } from './constants';

interface AgentResponse {
  inference_results: Array<{
    output: Array<{
      name: string;
      dataAsMap: {
        response: string;
        additional_info: object;
      };
    }>;
  }>;
}

/**
 * Api Provider to request a agent.
 */
export class AgentFrameworkApiProvider implements ApiProvider {
  constructor(private readonly providerId = PROVIDERS.AGENT_FRAMEWORK) {}

  id() {
    return this.providerId;
  }

  private getAgentId() {
    const id = process.env.AGENT_ID;
    if (!id) throw new Error('$AGENT_ID environment variable not set');
    return id;
  }

  async callApi(
    prompt: string,
    context?: { vars: Record<string, string | object> },
  ): Promise<ProviderResponse> {
    try {
      const agentId = this.getAgentId();
      const response = (await openSearchClient.transport.request({
        method: 'POST',
        path: `/_plugins/_ml/agents/${agentId}/_execute`,
        body: JSON.stringify({
          parameters: {
            question: prompt,
          },
        }),
      })) as ApiResponse<AgentResponse, unknown>;
      const output = response.body.inference_results[0].output[0].dataAsMap.response;
      if (!output) throw new Error('Cannot find output from agent response');
      return { output };
    } catch (error) {
      console.error('Failed to request agent:', error);
      return { error: `API call error: ${String(error)}` };
    }
  }
}
