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

# token EMAIL NOME PAPEL CPF [TIPO_ANUNCIANTE]  -> cadastra (ou faz login se ja existe) e imprime o token JWT
# TIPO_ANUNCIANTE (so' para PAPEL=ADVERTISER): VAGA | ESTABELECIMENTO
token() {
  local email=$1 name=$2 role=$3 cpf=$4 kind=${5:-} res
  local kindJson=""
  if [ -n "$kind" ]; then kindJson=",\"advertiserKind\":\"$kind\""; fi
  res=$(api POST /auth/register "" "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASS\",\"birthDate\":\"2001-06-15\",\"cpf\":\"$cpf\",\"role\":\"$role\"$kindJson}")
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
R1=$(token rita.alugar@teste.com "Rita Renter" RENTER 22042083534); reset_listings "$R1"
profile "$R1" '{"gender":"FEMININO","smokingHabit":"NAO_FUMO","drinkingHabit":"NAO_CURTO","diet":"VEGETARIANO","petPreferences":["NAO_TENHO_MAS_AMO"],"allergyTags":["POEIRA"],"musicTaste":"mpb, rock, jazz","routine":"DIURNO","bio":"Estudante de Engenharia, tranquila e organizada.","occupation":"Engenharia Civil - UEM"}'

R2=$(token caio.alugar@teste.com "Caio Renter" RENTER 47723141726); reset_listings "$R2"
profile "$R2" '{"gender":"MASCULINO","smokingHabit":"FUMANTE","drinkingHabit":"BEBO_COM_MODERACAO","diet":"ONIVORO","petPreferences":["CACHORRO","GOSTO_DE_TODOS"],"allergyTags":["NENHUMA"],"musicTaste":"funk, sertanejo","routine":"NOTURNO","bio":"Gosto de festa e tenho um cachorro.","occupation":"Administração - UniCesumar"}'

token novato.alugar@teste.com "Novato Sem Perfil" RENTER 48299493250 > /dev/null

echo "== Contas para ANUNCIAR: tenho vaga =="
A1=$(token bia.vaga@teste.com "Bia Vaga" ADVERTISER 64949327623 VAGA); reset_listings "$A1"
profile "$A1" '{"gender":"FEMININO","smokingHabit":"NAO_FUMO","drinkingHabit":"NAO_CURTO","diet":"VEGETARIANO","petPreferences":["NAO_TENHO_MAS_AMO"],"allergyTags":["NENHUMA"],"musicTaste":"mpb, jazz, rock","routine":"DIURNO","bio":"Moro com mais uma pessoa, casa calma.","occupation":"Direito - UEM"}'
listing "$A1" '{"type":"TEM_VAGA","title":"Vaga em apê de 2 quartos","description":"Apê mobiliado, perto do mercado.","preferredNeighborhood":"Zona 7","price":650,"address":"Av. Colombo, 5000 - Zona 7","latitude":-23.4108,"longitude":-51.9470}' > /dev/null
listing "$A1" '{"type":"TEM_VAGA","title":"Vaga em república feminina","description":"Quarto compartilhado.","preferredNeighborhood":"Zona 2","price":450,"availableSlots":1,"genderPreference":"FEMININO","address":"Rua Neo Alves Martins, 300 - Zona 2","latitude":-23.4280,"longitude":-51.9400}' > /dev/null

A2=$(token davi.vaga@teste.com "Davi Vaga" ADVERTISER 44004744377 VAGA); reset_listings "$A2"
profile "$A2" '{"gender":"MASCULINO","smokingHabit":"FUMANTE","drinkingHabit":"BEBO_COM_MODERACAO","diet":"ONIVORO","petPreferences":["CACHORRO","GOSTO_DE_TODOS"],"allergyTags":["NENHUMA"],"musicTaste":"funk, sertanejo","routine":"NOTURNO","bio":"Casa animada, recebo amigos.","occupation":"Educação Física - UniCesumar"}'
listing "$A2" '{"type":"TEM_VAGA","title":"Vaga em casa com quintal","description":"Aceito pet.","preferredNeighborhood":"Zona 5","price":500,"address":"Rua Santos Dumont, 800 - Zona 5","latitude":-23.4150,"longitude":-51.9250}' > /dev/null

echo "== Contas para ANUNCIAR: estabelecimento =="
A3=$(token marcos.imoveis@teste.com "Marcos Imóveis" ADVERTISER 71761797867 ESTABELECIMENTO); reset_listings "$A3"
profile "$A3" '{"gender":"MASCULINO","allergyTags":[],"petPreferences":[],"bio":"Proprietário de imóveis para aluguel.","occupation":"Proprietário"}'
listing "$A3" '{"type":"ESTABELECIMENTO","title":"Kitnet mobiliada no Centro","description":"Kitnet 25m², sem pets e sem fumantes.","preferredNeighborhood":"Centro","price":900,"address":"Av. Brasil, 1200 - Centro","latitude":-23.4205,"longitude":-51.9333,"acceptsPets":false,"acceptsSmoker":false}' > /dev/null
CASA=$(listing "$A3" '{"type":"ESTABELECIMENTO","title":"Casa 3 quartos na Zona 7","description":"Aceita pets e fumantes (área externa).","preferredNeighborhood":"Zona 7","price":2200,"address":"Rua Mandaguari, 450 - Zona 7","latitude":-23.4100,"longitude":-51.9490,"acceptsPets":true,"acceptsSmoker":true}')

echo "== Conta com os 3 anuncios gratis ja em uso =="
A4=$(token lucia.limite@teste.com "Lúcia Limite" ADVERTISER 09198740962); reset_listings "$A4"
profile "$A4" '{"gender":"FEMININO","smokingHabit":"NAO_FUMO","drinkingHabit":"BEBO_COM_MODERACAO","diet":"ONIVORO","petPreferences":["CACHORRO"],"allergyTags":["NENHUMA"],"musicTaste":"pop, mpb","routine":"MISTO","bio":"Ja tenho 3 anuncios ativos.","occupation":"Corretora"}'
listing "$A4" '{"type":"ESTABELECIMENTO","title":"Apartamento 1 quarto Zona 3","description":"Aceita pets.","preferredNeighborhood":"Zona 3","price":1300,"address":"Rua Pioneiro, 100 - Zona 3","latitude":-23.4000,"longitude":-51.9300,"acceptsPets":true,"acceptsSmoker":false}' > /dev/null
listing "$A4" '{"type":"ESTABELECIMENTO","title":"Sala comercial adaptada","description":"Sem pets.","preferredNeighborhood":"Centro","price":1500,"address":"Av. Herval, 700 - Centro","latitude":-23.4230,"longitude":-51.9350,"acceptsPets":false,"acceptsSmoker":false}' > /dev/null
listing "$A4" '{"type":"TEM_VAGA","title":"Vaga em apê compartilhado","description":"Quarto individual.","preferredNeighborhood":"Zona 3","price":600,"address":"Rua Pioneiro, 250 - Zona 3","latitude":-23.4005,"longitude":-51.9310}' > /dev/null

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
