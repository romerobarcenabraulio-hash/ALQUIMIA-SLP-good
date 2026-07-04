"""Document upload and management endpoints

Integrates with ARCHIVO pipeline for processing.
"""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.document_archive import TenantDocument
from app.services.archivo_pipeline import ArchivoPipeline
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/tenants", tags=["documents"])


@router.post("/{tenant_id}/documents/upload")
async def upload_document(
    tenant_id: str,
    file: UploadFile = File(...),
    module_id: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document and trigger ARCHIVO pipeline processing.

    - **tenant_id**: Which municipality/organization
    - **file**: PDF or document file
    - **module_id**: Which consulting module this relates to
    - **document_type**: Classification hint (optional)

    Returns:
    - document_id: Stored document ID
    - archivo_request_id: Processing request ID
    - status: "processing" or "completed"
    - data_points_created: How many DataPoints were extracted
    """
    try:
        # Validate inputs
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must have a filename",
            )

        if file.content_type not in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and Word documents are supported",
            )

        # Store document metadata
        document_id = str(uuid.uuid4())
        file_size_bytes = 0

        # Read file content (in production, would save to S3/GCS)
        content = await file.read()
        file_size_bytes = len(content)

        # Create TenantDocument record
        tenant_doc = TenantDocument(
            id=document_id,
            tenant_id=tenant_id,
            uploaded_by_user_id="system",  # TODO: from auth context
            module_id=module_id or "general",
            document_type=document_type or "unknown",
            original_filename=file.filename,
            mime_type=file.content_type,
            file_size_bytes=file_size_bytes,
            storage_path_or_url=f"temp://uploads/{tenant_id}/{document_id}",
            upload_status="received",
            classification_confidence="suggested_by_filename",
            uploaded_at=datetime.now(timezone.utc),
        )

        # TODO: Save to DB and storage
        # db.add(tenant_doc)
        # await db.commit()

        # Trigger ARCHIVO pipeline
        processing_result = await ArchivoPipeline.process_document(
            db=db,
            tenant_id=tenant_id,
            document_id=document_id,
            original_filename=file.filename,
            module_id=module_id or "general",
            uploaded_by_user_id="system",
            document_path=f"temp://uploads/{tenant_id}/{document_id}",
        )

        return {
            "document_id": document_id,
            "archivo_request_id": processing_result.request_id,
            "status": processing_result.status,
            "data_points_created": processing_result.data_points_created,
            "conflicts_detected": processing_result.conflicts_detected,
            "gaps_closed": processing_result.gaps_closed,
            "warnings": processing_result.warnings,
            "errors": processing_result.errors,
            "processing_duration_ms": processing_result.processing_duration_ms,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}",
        )


@router.get("/{tenant_id}/documents")
async def list_documents(
    tenant_id: str,
    module_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a tenant, optionally filtered by module"""
    # TODO: Query TenantDocument
    return {"documents": [], "total": 0}


@router.get("/{tenant_id}/documents/{document_id}")
async def get_document(
    tenant_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get metadata for a specific document"""
    # TODO: Query TenantDocument by ID
    return {"document": None}
