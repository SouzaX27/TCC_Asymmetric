# from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, permissions
from .models import Produto
from .serializers import ProdutoSerializer, RegistrarClienteSerializer, ClientePerfilSerializer

class ProdutoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer

class RegistrarClienteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistrarClienteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"mensagem": "Cliente cadastrado com sucesso!"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user vem do token JWT enviado no Header
        cliente = request.user.cliente
        serializer = ClientePerfilSerializer(cliente)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        cliente = request.user.cliente
        serializer = ClientePerfilSerializer(cliente, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)