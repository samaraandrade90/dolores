# Modificações na Edge Function send-task-reminders

## Visão Geral
A Edge Function `send-task-reminders` deve ser atualizada para suportar configurações de notificação individuais por tarefa, respeitando as novas colunas adicionadas à tabela `public.tasks`.

## Lógica Atualizada da Edge Function

### 1. Query Principal (Seleção de Tarefas Elegíveis)

```sql
SELECT 
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.date,
    t.time,
    t.notify_me,
    t.notification_offset_minutes,
    t.last_notified_at,
    up.notification_preference_minutes,
    up.push_token
FROM public.tasks t
JOIN public.user_profiles up ON t.user_id = up.user_id
WHERE 
    -- Apenas tarefas não completadas e com notificação habilitada
    t.completed = FALSE 
    AND t.notify_me = TRUE
    
    -- Apenas tarefas com data e hora definidas
    AND t.date IS NOT NULL 
    AND t.time IS NOT NULL
    
    -- Apenas usuários com push tokens válidos
    AND up.push_token IS NOT NULL 
    AND up.push_token != ''
    
    -- Otimização: apenas tarefas de hoje ou futuras
    AND t.date >= CURRENT_DATE
ORDER BY t.date, t.time;
```

### 2. Lógica de Processamento para Cada Tarefa

```javascript
for (const task of eligibleTasks) {
    // 2.1 Determinar o offset de notificação
    const offsetMinutes = task.notification_offset_minutes ?? task.notification_preference_minutes ?? 60;
    
    // 2.2 Calcular o momento exato para notificação
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const notificationTriggerTime = new Date(taskDateTime.getTime() - (offsetMinutes * 60 * 1000));
    
    // 2.3 Verificar se está na janela de tempo para envio
    const now = new Date();
    const bufferMinutes = 15; // Buffer de 15 minutos para capturar notificações "a tempo"
    const windowEnd = new Date(now.getTime() + (bufferMinutes * 60 * 1000));
    
    const shouldNotify = (
        notificationTriggerTime >= now && 
        notificationTriggerTime <= windowEnd
    );
    
    if (!shouldNotify) continue;
    
    // 2.4 Verificar se já foi notificado para evitar duplicatas
    if (task.last_notified_at) {
        const lastNotified = new Date(task.last_notified_at);
        // Se já foi notificado após o momento calculado, skip
        if (lastNotified >= notificationTriggerTime) {
            continue;
        }
    }
    
    // 2.5 Enviar notificação
    try {
        await sendPushNotification({
            token: task.push_token,
            title: task.title,
            body: task.description || `Tarefa agendada para ${task.time}`,
            data: {
                taskId: task.id,
                taskDate: task.date,
                taskTime: task.time
            }
        });
        
        // 2.6 Atualizar last_notified_at após envio bem-sucedido
        await supabase
            .from('tasks')
            .update({ 
                last_notified_at: new Date().toISOString() 
            })
            .eq('id', task.id);
            
        console.log(`Notificação enviada para tarefa ${task.id}`);
        
    } catch (error) {
        console.error(`Erro ao enviar notificação para tarefa ${task.id}:`, error);
        // Não atualizar last_notified_at em caso de erro
    }
}
```

### 3. Exemplos de Configuração

#### Exemplo 1: Tarefa com offset personalizado
```
task.notification_offset_minutes = 1440 (24 horas)
task.date = "2025-01-15"
task.time = "14:30:00"
→ Notificação enviada em: 2025-01-14 às 14:30:00
```

#### Exemplo 2: Tarefa usando preferência global
```
task.notification_offset_minutes = NULL
user_profiles.notification_preference_minutes = 60
task.date = "2025-01-15"  
task.time = "14:30:00"
→ Notificação enviada em: 2025-01-15 às 13:30:00
```

#### Exemplo 3: Notificação "na hora"
```
task.notification_offset_minutes = 0
task.date = "2025-01-15"
task.time = "14:30:00"
→ Notificação enviada em: 2025-01-15 às 14:30:00
```

### 4. Configuração de Janela de Tempo

A janela de tempo deve ser configurável, mas sugerimos:
- **Buffer de captura**: 15 minutos à frente do momento atual
- **Frequência de execução**: A cada 5-10 minutos via cron
- **Timeout de função**: 60 segundos para processar todas as notificações

### 5. Melhorias de Performance

1. **Índices**: Os índices criados no SQL otimizam a query principal
2. **Limite de processamento**: Processar máximo 100 tarefas por execução
3. **Batch de atualizações**: Agrupar updates de `last_notified_at` se necessário

### 6. Logs e Monitoramento

```javascript
// Adicionar logs detalhados para debugging
console.log({
    totalTasksFound: eligibleTasks.length,
    tasksProcessed: processedCount,
    notificationsSent: sentCount,
    errors: errorCount,
    executionTime: Date.now() - startTime
});
```

### 7. Tratamento de Erros

- **Token inválido**: Log e continue com próxima tarefa
- **Erro de rede**: Retry até 3 vezes com backoff exponencial  
- **Erro de database**: Log crítico e interromper execução
- **Timeout**: Log e garantir que `last_notified_at` não seja atualizado

### 8. Configuração de Cron Sugerida

```
# A cada 10 minutos durante horário ativo (6h às 23h)
*/10 6-23 * * * 

# A cada 30 minutos durante madrugada (0h às 5h)  
*/30 0-5 * * *
```

Esta lógica garante que:
- ✅ Apenas tarefas com `notify_me = TRUE` sejam processadas
- ✅ Offset personalizado por tarefa seja respeitado
- ✅ Fallback para preferência global do usuário funcione
- ✅ Notificações duplicadas sejam evitadas
- ✅ Performance seja otimizada com índices adequados
- ✅ Erros sejam tratados graciosamente