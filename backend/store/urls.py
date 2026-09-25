from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import ProdutoViewSet, RegistrarClienteView

router = DefaultRouter()
router.register(r'produtos', ProdutoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('usuarios/registrar/', RegistrarClienteView.as_view(), name='registrar_cliente'),

    # Rotas de Autenticação JWT
    path('usuarios/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('usuarios/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]