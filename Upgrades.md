- um endpoint POST para enviar as mensagens determinadas para clientes determinados cada uma de uma vez com um intervalo de 3 minutos.

- Parametros -> 
    ?allBase(true) -> enviar para todos os contatos no DB.
    
    ?delay(int) -> Pegar campo de createdAt no DB 
        (where date(createdAt) = current_date() - delay)
        
    clientId(string[]) ->  
    
    messageId -> Mensagem a ser enviada 
    
    ?placement(String) -> uma consulta no DB where
    
    
Nova tabela -> 
    messageId - Id da mensagem
    message - Mensagem/Texto
    
- Se ficar no fluxo mais de 5 minutos mandar o ebook com as mensagens

- Atualizar o bot para funções
