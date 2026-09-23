#!/usr/bin/env bash
# =====================================================================
# RachaAi - cria usuarios, perfis, anuncios e uma conversa de demonstracao.
#
# Uso (com a stack no ar):
#     bash scripts/seed-demo.sh                 # usa http://localhost:8081/api (via nginx)
#     BASE=http://localhost:8080/api bash scripts/seed-demo.sh   # direto no backend
#
# Pode rodar quantas vezes quiser: usuarios que ja existem sao reaproveitados
# (login) e os anuncios de cada usuario sao recriados do zero.
# Todos os usuarios usam a senha "senha123".
#
# Requer: bash e curl (Git Bash no Windows ou WSL).
# =====================================================================
set -u

BASE="${BASE:-http://localhost:8081/api}"
PASS="senha123"

# api METODO CAMINHO TOKEN CORPO
# O corpo vai por stdin (--data-binary @-) para preservar acentos no curl do Windows.
api() {
  local method=$1 path=$2 tok=$3 body=$4
  if [ -n "$tok" ]; then
    printf '%s' "$body" | curl -s -X "$method" "$BASE$path" -H "Content-Type: application/json" -H "Authorization: Bearer $tok" --data-binary @-
  else
    printf '%s' "$body" | curl -s -X "$method" "$BASE$path" -H "Content-Type: application/json" --data-binary @-
  fi
}

# token EMAIL NOME PAPEL [TIPO_ANUNCIANTE]  -> cadastra (ou faz login se ja existe) e imprime o token JWT
# TIPO_ANUNCIANTE (so' para PAPEL=ADVERTISER): VAGA | ESTABELECIMENTO
token() {
  local email=$1 name=$2 role=$3 kind=${4:-} res
  local kindJson=""
  if [ -n "$kind" ]; then kindJson=",\"advertiserKind\":\"$kind\""; fi
  res=$(api POST /auth/register "" "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASS\",\"birthDate\":\"2001-06-15\",\"role\":\"$role\"$kindJson}")
  if ! echo "$res" | grep -q '"token"'; then
    res=$(api POST /auth/login "" "{\"email\":\"$email\",\"password\":\"$PASS\"}")
  fi
  echo "$res" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

profile() { api PUT /users/me/profile "$1" "$2" > /dev/null; }

# remove (desativa) todos os anuncios ativos do usuario
reset_listings() {
  local ids id
  ids=$(curl -s "$BASE/listings/mine" -H "Authorization: Bearer $1" | grep -o '"id":[0-9]*,"userId"' | grep -o '[0-9]*' | head -30)
  for id in $ids; do curl -s -X DELETE "$BASE/listings/$id" -H "Authorization: Bearer $1" > /dev/null; done
}

# listing TOKEN JSON -> imprime o id do anuncio criado (ou o erro, em stderr)
listing() {
  local out
  out=$(api POST /listings "$1" "$2")
  if echo "$out" | grep -q '"id"'; then
    echo "$out" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*'
  else
    echo "FALHOU ao criar anuncio: $out" >&2
  fi
}

echo "API: $BASE"
if ! curl -s -o /dev/null --max-time 5 "$BASE/auth/login" -X POST -H "Content-Type: application/json" -d '{}'; then
  echo "Nao consegui falar com a API. A stack esta no ar? (docker compose ps)" >&2
  exit 1
fi

echo "== Contas para ALUGAR =="
R1=$(token rita.alugar@teste.com "Rita Renter" RENTER); reset_listings "$R1"
profile "$R1" '{"smoker":false,"drinksAlcohol":false,"vegetarian":true,"hasPets":false,"likesAnimals":true,"allergies":"poeira","musicTaste":"mpb, rock, jazz","routine":"DIURNO","bio":"Estudante de Engenharia, tranquila e organizada.","occupation":"Engenharia Civil - UEM"}'
listing "$R1" '{"type":"PROCURANDO","title":"Procuro apê perto da UEM","description":"Quero dividir com alguém tranquilo.","preferredNeighborhood":"Zona 7","nearCollege":"UEM","price":700}' > /dev/null

R2=$(token caio.alugar@teste.com "Caio Renter" RENTER); reset_listings "$R2"
profile "$R2" '{"smoker":true,"drinksAlcohol":true,"vegetarian":false,"hasPets":true,"likesAnimals":true,"allergies":"","musicTaste":"funk, sertanejo","routine":"NOTURNO","bio":"Gosto de festa e tenho um cachorro.","occupation":"Administração - UniCesumar"}'
listing "$R2" '{"type":"PROCURANDO","title":"Procuro vaga na Zona 2","description":"Tenho um cachorro.","preferredNeighborhood":"Zona 2","nearCollege":"UniCesumar","price":500}' > /dev/null

token novato.alugar@teste.com "Novato Sem Perfil" RENTER > /dev/null

echo "== Contas para ANUNCIAR: tenho vaga =="
A1=$(token bia.vaga@teste.com "Bia Vaga" ADVERTISER VAGA); reset_listings "$A1"
profile "$A1" '{"smoker":false,"drinksAlcohol":false,"vegetarian":true,"hasPets":false,"likesAnimals":true,"allergies":"","musicTaste":"mpb, jazz, rock","routine":"DIURNO","bio":"Moro com mais uma pessoa, casa calma.","occupation":"Direito - UEM"}'
listing "$A1" '{"type":"TEM_VAGA","title":"Vaga em apê de 2 quartos","description":"Apê mobiliado, perto do mercado.","preferredNeighborhood":"Zona 7","nearCollege":"UEM","price":650,"address":"Av. Colombo, 5000 - Zona 7","latitude":-23.4108,"longitude":-51.9470}' > /dev/null
listing "$A1" '{"type":"TEM_VAGA","title":"Vaga em república feminina","description":"Quarto compartilhado.","preferredNeighborhood":"Zona 2","nearCollege":"UniCesumar","price":450,"address":"Rua Neo Alves Martins, 300 - Zona 2","latitude":-23.4280,"longitude":-51.9400}' > /dev/null

A2=$(token davi.vaga@teste.com "Davi Vaga" ADVERTISER VAGA); reset_listings "$A2"
profile "$A2" '{"smoker":true,"drinksAlcohol":true,"vegetarian":false,"hasPets":true,"likesAnimals":true,"allergies":"","musicTaste":"funk, sertanejo","routine":"NOTURNO","bio":"Casa animada, recebo amigos.","occupation":"Educação Física - UniCesumar"}'
listing "$A2" '{"type":"TEM_VAGA","title":"Vaga em casa com quintal","description":"Aceito pet.","preferredNeighborhood":"Zona 5","nearCollege":"UniCesumar","price":500,"address":"Rua Santos Dumont, 800 - Zona 5","latitude":-23.4150,"longitude":-51.9250}' > /dev/null

echo "== Contas para ANUNCIAR: estabelecimento =="
A3=$(token marcos.imoveis@teste.com "Marcos Imóveis" ADVERTISER ESTABELECIMENTO); reset_listings "$A3"
profile "$A3" '{"smoker":false,"drinksAlcohol":false,"vegetarian":false,"hasPets":false,"likesAnimals":false,"allergies":"","musicTaste":"","routine":"DIURNO","bio":"Proprietário de imóveis para aluguel.","occupation":"Proprietário"}'
listing "$A3" '{"type":"ESTABELECIMENTO","title":"Kitnet mobiliada no Centro","description":"Kitnet 25m², sem pets e sem fumantes.","preferredNeighborhood":"Centro","nearCollege":"UEM","price":900,"address":"Av. Brasil, 1200 - Centro","latitude":-23.4205,"longitude":-51.9333,"acceptsPets":false,"acceptsSmoker":false}' > /dev/null
CASA=$(listing "$A3" '{"type":"ESTABELECIMENTO","title":"Casa 3 quartos na Zona 7","description":"Aceita pets e fumantes (área externa).","preferredNeighborhood":"Zona 7","nearCollege":"UEM","price":2200,"address":"Rua Mandaguari, 450 - Zona 7","latitude":-23.4100,"longitude":-51.9490,"acceptsPets":true,"acceptsSmoker":true}')

echo "== Conta com os 3 anuncios gratis ja em uso =="
A4=$(token lucia.limite@teste.com "Lúcia Limite" ADVERTISER); reset_listings "$A4"
profile "$A4" '{"smoker":false,"drinksAlcohol":true,"vegetarian":false,"hasPets":true,"likesAnimals":true,"allergies":"","musicTaste":"pop, mpb","routine":"MISTO","bio":"Ja tenho 3 anuncios ativos.","occupation":"Corretora"}'
listing "$A4" '{"type":"ESTABELECIMENTO","title":"Apartamento 1 quarto Zona 3","description":"Aceita pets.","preferredNeighborhood":"Zona 3","nearCollege":"UEM","price":1300,"address":"Rua Pioneiro, 100 - Zona 3","latitude":-23.4000,"longitude":-51.9300,"acceptsPets":true,"acceptsSmoker":false}' > /dev/null
listing "$A4" '{"type":"ESTABELECIMENTO","title":"Sala comercial adaptada","description":"Sem pets.","preferredNeighborhood":"Centro","nearCollege":"UEM","price":1500,"address":"Av. Herval, 700 - Centro","latitude":-23.4230,"longitude":-51.9350,"acceptsPets":false,"acceptsSmoker":false}' > /dev/null
listing "$A4" '{"type":"TEM_VAGA","title":"Vaga em apê compartilhado","description":"Quarto individual.","preferredNeighborhood":"Zona 3","nearCollege":"UEM","price":600,"address":"Rua Pioneiro, 250 - Zona 3","latitude":-23.4005,"longitude":-51.9310}' > /dev/null

echo "== Conversa de exemplo: Rita -> Casa do Marcos (anuncio ${CASA:-?}) =="
RITA_CONVERSAS=$(curl -s "$BASE/conversations" -H "Authorization: Bearer $R1" | grep -o '"otherUser"' | wc -l)
if [ "$RITA_CONVERSAS" -gt 0 ]; then
  echo "Rita ja tem conversa(s); nao criei outra"
elif [ -n "${CASA:-}" ]; then
  CONV=$(api POST /conversations "$R1" "{\"listingId\":$CASA}" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  api POST /conversations/$CONV/messages "$R1" '{"content":"Olá! A casa ainda está disponível?"}' > /dev/null
  api POST /conversations/$CONV/messages "$A3" '{"content":"Oi Rita! Está sim, posso agendar uma visita."}' > /dev/null
  echo "conversa $CONV pronta"
fi

echo
echo "Pronto. Senha de todos os usuarios: $PASS"
echo "  alugar:   rita.alugar@teste.com | caio.alugar@teste.com | novato.alugar@teste.com"
echo "  anunciar: bia.vaga@teste.com | davi.vaga@teste.com | marcos.imoveis@teste.com | lucia.limite@teste.com"
