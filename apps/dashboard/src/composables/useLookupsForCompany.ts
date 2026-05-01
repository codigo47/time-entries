import { computed } from 'vue'
import { useLookupsStore } from '@/stores/lookups'

export function useLookupsForCompany(companyId: () => string | undefined) {
  const store = useLookupsStore()

  const employees = computed(() => companyId() ? store.employeesByCompany[companyId()!] ?? [] : [])
  const projects = computed(() => companyId() ? store.projectsByCompany[companyId()!] ?? [] : [])
  const tasks = computed(() => companyId() ? store.tasksByCompany[companyId()!] ?? [] : [])

  async function ensure() {
    const id = companyId()
    if (!id) return
    await Promise.all([store.loadEmployees(id), store.loadProjects(id), store.loadTasks(id)])
  }

  return { employees, projects, tasks, ensure }
}
