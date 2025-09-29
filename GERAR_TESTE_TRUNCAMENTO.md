# Teste de Truncamento - Arquivo com Mais de 200 linhas

Este arquivo Python gera um CSV com mais de s para testar a funcionalidade de truncamento.

```python
import csv
import random
from datetime import datetime, timedelta

# Dados base para geração
filiais = [
    ("01", "01-URBANO MATRIZ"),
    ("02", "02-SAO GABRIEL"),
    ("03", "03-MELEIRO"),
    ("04", "04-SINOP"),
    ("06", "06-CABO DE STO AGO"),
    ("07", "07-FORTALEZA"),
    ("08", "08-BRASILIA"),
    ("10", "10-SALVADOR"),
    ("11", "11-GUARULHOS 1"),
    ("12", "12-GUARULHOS 2"),
    ("14", "14-PONTA GROSSA"),
    ("15", "15-VARZEA GRANDE"),
    ("21", "21-FORMOSA"),
    ("01", "01-BROTO LEGAL CAMPINAS"),
    ("02", "02-BROTO LEGAL PORTO FERREIRA"),
    ("03", "03-BROTO LEGAL URUGUAIANA")
]

tipos_veiculo = [
    "TRUCK", "3/4", "BI-TREM", "BI-TRUCK", "CARRETA BAU", "CARRETA CARGA BAIXA",
    "CARRETA GRANELEIRA", "CARRETA PRANCHA (CONTAINER)", "CARRETA SIDER",
    "CAV MEC SIMPLES", "CAV MEC QUATRO EIXOS", "FIORINO", "HR", "TOCO",
    "VAN / FURGAO", "SPRINTERF", "REBOQUE", "CARGA SEMI REBOQUE"
]

tipos_frota = ["Leve/Extraleve", "Semi Pesado", "Pesado"]
cidades = ["SAO PAULO", "RIO DE JANEIRO", "BELO HORIZONTE", "SALVADOR", "FORTALEZA", "BRASILIA", "CURITIBA", "RECIFE", "PORTO ALEGRE", "MANAUS"]
ufs = ["SP", "RJ", "MG", "BA", "CE", "DF", "PR", "PE", "RS", "AM"]
transportadoras = [
    "TRANSPORTES EXEMPLO LTDA", "TRANSPORTES SUL LTDA", "TRANSPORTES SC LTDA",
    "TRANSPORTES MT LTDA", "TRANSPORTES BA LTDA", "TRANSPORTES SP LTDA",
    "TRANSPORTES CE LTDA", "TRANSPORTES DF LTDA", "TRANSPORTES PR LTDA",
    "TRANSPORTES VG LTDA", "TRANSPORTES GO LTDA", "TRANSPORTES GRU LTDA"
]

# Gerar 1500 linhas de dados para testar truncamento
with open('teste_1500_linhas.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = [
        'Filial', 'Filial - Nome', 'Data Emissao', 'CFOP', 'Cidade Destino',
        'Cliente - UF', 'Lote', 'Placa', 'Transportadora', 'Peso Líq Calc',
        'Peso Bruto', 'Tp Veículo', 'Tp Frota', 'Qt Eixos'
    ]

    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    for i in range(1, 1501):  # 1500 linhas
        filial = random.choice(filiais)
        tipo_veiculo = random.choice(tipos_veiculo)
        tipo_frota = random.choice(tipos_frota)
        cidade = random.choice(cidades)
        uf = random.choice(ufs)
        transportadora = random.choice(transportadoras)

        # Gerar pesos baseados no tipo de frota
        if "Leve" in tipo_frota:
            peso_base = random.randint(500, 3000)
        elif "Semi" in tipo_frota:
            peso_base = random.randint(3000, 11000)
        else:
            peso_base = random.randint(11000, 40000)

        peso_liquido = peso_base
        peso_bruto = peso_base + random.randint(100, 2000)

        # Determinar quantidade de eixos baseada no tipo de veículo
        if tipo_veiculo in ["3/4", "FIORINO", "HR", "VAN / FURGAO", "SPRINTERF"]:
            qt_eixos = 2
        elif tipo_veiculo in ["TRUCK", "BI-TRUCK", "TOCO"]:
            qt_eixos = random.choice([2, 3, 4])
        elif "CARRETA" in tipo_veiculo or "CAV MEC" in tipo_veiculo:
            qt_eixos = random.choice([3, 4, 5, 6, 7])
        elif tipo_veiculo in ["BI-TREM"]:
            qt_eixos = random.choice([6, 7, 8, 9])
        else:
            qt_eixos = random.choice([2, 3, 4])

        # Gerar data dos últimos 30 dias
        data_base = datetime.now() - timedelta(days=random.randint(0, 30))
        data_formatada = data_base.strftime("%d/%m/%Y")

        # Gerar placa
        letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        numeros = "0123456789"
        placa = f"{''.join(random.choices(letras, k=3))}{''.join(random.choices(numeros, k=4))}"

        writer.writerow({
            'Filial': filial[0],
            'Filial - Nome': filial[1],
            'Data Emissao': data_formatada,
            'CFOP': 'VENDA',
            'Cidade Destino': cidade,
            'Cliente - UF': uf,
            'Lote': str(random.randint(100000, 999999)),
            'Placa': placa,
            'Transportadora': transportadora,
            'Peso Líq Calc': peso_liquido,
            'Peso Bruto': peso_bruto,
            'Tp Veículo': tipo_veiculo,
            'Tp Frota': tipo_frota,
            'Qt Eixos': qt_eixos
        })

print("Arquivo 'teste_1500_linhas.csv' criado com 1500 linhas!")
print("Use este arquivo para testar a funcionalidade de truncamento.")
print("O sistema deve processar apenas as primeiras 200 linhas e mostrar o alerta de truncamento.")
```

Execute este script Python para gerar o arquivo de teste.
