# Configuração de Volumes no Dokploy (Hostinger)

## ✅ Volume Já Configurado

O `docker-compose.yml` já define o volume necessário:

```yaml
volumes:
  - uploads-data:/app/backend/uploads

volumes:
  uploads-data:
```

## 🔧 Verificação no Dokploy

### 1. Verificar Volume Criado

No terminal SSH da sua VM Hostinger:

```bash
# Listar volumes do Docker
docker volume ls

# Inspecionar o volume específico
docker volume inspect <nome-do-projeto>_uploads-data
```

### 2. Ver Localização dos Arquivos

```bash
# O volume geralmente fica em:
docker volume inspect <nome-do-projeto>_uploads-data | grep Mountpoint
```

### 3. Verificar Arquivos Dentro do Container

```bash
# Acessar o container
docker exec -it frete-backend sh

# Listar arquivos no diretório de uploads
ls -la /app/backend/uploads

# Verificar permissões
stat /app/backend/uploads
```

## 📁 Estrutura de Arquivos

```
Volume Docker: uploads-data
  ↓
Mapeado para: /app/backend/uploads (dentro do container)
  ↓
Contém: arquivos .xlsx enviados pelos usuários
```

## 🔒 Segurança e Permissões

O Dockerfile já configura:

- ✅ Diretório `uploads` criado automaticamente
- ✅ Permissões para usuário `appuser` (não-root)
- ✅ Volume persiste mesmo após restart do container

## 🚨 Solução de Problemas

### Erro: "Permission denied" ao fazer upload

```bash
# Dentro do container, verificar proprietário
docker exec -it frete-backend sh
ls -la /app/backend/uploads
# Deve mostrar: appuser appuser

# Se necessário, corrigir permissões (como root)
docker exec -u root -it frete-backend sh
chown -R appuser:appuser /app/backend/uploads
chmod -R 755 /app/backend/uploads
```

### Volume não persiste após redeploy

No Dokploy:

1. Acesse seu projeto
2. Vá em **Volumes**
3. Confirme que `uploads-data` está listado
4. Verifique se está marcado como **persistente**

### Limpar arquivos antigos

```bash
# Acessar o container
docker exec -it frete-backend sh

# Remover arquivos com mais de 7 dias
find /app/backend/uploads -type f -mtime +7 -delete
```

## 📊 Monitoramento

### Ver tamanho do volume

```bash
# Tamanho total do volume
docker system df -v | grep uploads-data
```

### Backup do volume

```bash
# Criar backup
docker run --rm \
  -v <nome-do-projeto>_uploads-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restaurar backup
docker run --rm \
  -v <nome-do-projeto>_uploads-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## 🔄 Deploy no Dokploy

Ao fazer deploy:

1. **Primeiro Deploy**: O volume é criado automaticamente
2. **Redesploy**: O volume **persiste** os arquivos
3. **Rollback**: Os arquivos permanecem intactos

## 💡 Boas Práticas

1. **Limpeza Automática**: Considere implementar cron job para limpar arquivos antigos
2. **Limite de Espaço**: Monitore o uso de disco da VM
3. **Backup Regular**: Faça backup periódico do volume se os arquivos forem críticos
4. **Logs**: Verifique logs se uploads falharem:
   ```bash
   docker logs frete-backend -f
   ```

## 📝 Variáveis de Ambiente Importantes

Certifique-se que o `backend/.env` contém:

```env
NODE_ENV=production
PORT=3000
# Adicione outras variáveis necessárias (API keys, etc)
```

## 🌐 No Dokploy Dashboard

1. Acesse seu projeto no Dokploy
2. Vá em **Settings** → **Volumes**
3. Confirme: `uploads-data` → `/app/backend/uploads`
4. Tipo: **Volume** (não bind mount)

---

**Status**: ✅ Configuração de volume já está pronta no `docker-compose.yml`

**Próximo Passo**: Fazer deploy e testar upload de arquivo pela interface
