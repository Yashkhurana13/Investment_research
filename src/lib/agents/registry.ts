import { BaseAgent } from './base';
import { AgentName } from '../types';

class AgentRegistry {
  private agents: Map<AgentName, BaseAgent<any, any>> = new Map();

  registerAgent(agent: BaseAgent<any, any>): void {
    if (this.agents.has(agent.metadata.name)) {
      console.warn(`Agent ${agent.metadata.name} is already registered. Overwriting.`);
    }
    this.agents.set(agent.metadata.name, agent);
  }

  getAgent<T extends BaseAgent<any, any>>(name: AgentName): T | undefined {
    return this.agents.get(name) as T | undefined;
  }

  listAgents(): AgentName[] {
    return Array.from(this.agents.keys());
  }
}

export const registry = new AgentRegistry();
