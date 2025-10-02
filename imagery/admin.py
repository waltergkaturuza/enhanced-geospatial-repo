from django.contrib import admin
from django.contrib.admin import ModelAdmin

from .models import AOI, SatelliteImage, Download, IndexResult

@admin.register(AOI)
class AOIAdmin(ModelAdmin):
    list_display = ('name', 'user', 'created_at')

@admin.register(SatelliteImage)
class SatelliteImageAdmin(ModelAdmin):
    list_display = ('tile_id', 'provider', 'sensed_at')

admin.site.register(Download)
admin.site.register(IndexResult)
