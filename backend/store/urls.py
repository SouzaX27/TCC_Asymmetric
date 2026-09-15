from django.urls import path, include
# from . import views
from rest_framework.routers import DefaultRouter
from .views import ProdutoViewSet, RegistrarClienteView

router = DefaultRouter()
router.register(r'produtos', ProdutoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('usuarios/registrar/', RegistrarClienteView.as_view(), name='registrar_cliente'),
]